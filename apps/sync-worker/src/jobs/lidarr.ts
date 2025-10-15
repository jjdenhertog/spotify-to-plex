import { getLidarrSettings } from "@spotify-to-plex/plex-config/functions/getLidarrSettings";
import { getStorageDir } from "@spotify-to-plex/shared-utils/utils/getStorageDir";
import { LidarrAlbumData } from "@spotify-to-plex/shared-types/lidarr/LidarrAlbumData";
import { LidarrAddAlbumRequest } from "@spotify-to-plex/shared-types/lidarr/LidarrAddAlbumRequest";
import { LidarrSyncLog } from "@spotify-to-plex/shared-types/lidarr/LidarrSyncLog";
import axios from "axios";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getNestedSyncLogsForType } from "../utils/getNestedSyncLogsForType";
import { startSyncType } from "../utils/startSyncType";
import { clearSyncTypeLogs } from "../utils/clearSyncTypeLogs";
import { completeSyncType } from "../utils/completeSyncType";
import { errorSyncType } from "../utils/errorSyncType";
import { getMusicBrainzIds } from "@spotify-to-plex/shared-utils/lidarr/getMusicBrainzIds";
import { lookupLidarrAlbum } from "@spotify-to-plex/shared-utils/lidarr/lookupLidarrAlbum";

export async function syncLidarr() {
    console.log('Starting Lidarr sync...');

    // Check Lidarr settings
    const settings = await getLidarrSettings();
    if (!settings.enabled)
        return;

    // Start sync type logging
    startSyncType('lidarr');
    clearSyncTypeLogs('lidarr');

    if (!settings.url)
        return;

    const apiKey = process.env.LIDARR_API_KEY;
    if (!apiKey)
        return;

    // Read albums and tracks to sync from both files
    const albumsPath = join(getStorageDir(), 'missing_albums_lidarr.json');
    const tracksPath = join(getStorageDir(), 'missing_tracks_lidarr.json');

    const albumsFromAlbums: LidarrAlbumData[] = [];
    const albumsFromTracks: LidarrAlbumData[] = [];

    // Read albums file
    if (existsSync(albumsPath)) {
        try {
            const content = readFileSync(albumsPath, 'utf8');
            const parsed = JSON.parse(content);
            albumsFromAlbums.push(...parsed);
        } catch (e) {
            console.error('Error reading missing_albums_lidarr.json:', e);
        }
    }

    // Read tracks file
    if (existsSync(tracksPath)) {
        try {
            const content = readFileSync(tracksPath, 'utf8');
            const parsed = JSON.parse(content);
            albumsFromTracks.push(...parsed);
        } catch (e) {
            console.error('Error reading missing_tracks_lidarr.json:', e);
        }
    }

    // Merge both arrays and deduplicate
    const albumMap = new Map<string, LidarrAlbumData>();
    [...albumsFromAlbums, ...albumsFromTracks].forEach(album => {
        const key = `${album.artist_name}|${album.album_name}`;
        albumMap.set(key, album);
    });

    const albums = Array.from(albumMap.values());

    if (albums.length === 0)
        return;

    // Initialize logs
    const { putLog, logComplete } = getNestedSyncLogsForType('lidarr');
    const syncLog = putLog('lidarr-sync', 'Lidarr Sync');

    // Read existing Lidarr logs
    const lidarrLogsPath = join(getStorageDir(), 'lidarr_sync_log.json');
    const lidarrLogs: Record<string, LidarrSyncLog> = {};

    // Process each album
    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;

    for (const album of albums) {
        const albumKey = `${album.artist_name}|${album.album_name}`;
        const logId = `${Date.now()}-${albumKey}`;

        const albumLog: LidarrSyncLog = {
            id: logId,
            artist_name: album.artist_name,
            album_name: album.album_name,
            start: Date.now(),
            status: 'error',
        };

        try {

            // VALIDATION: Ensure spotify_album_id exists
            if (!album.spotify_album_id) {
                albumLog.status = 'error';
                albumLog.error = 'Missing spotify_album_id';
                albumLog.end = Date.now();
                errorCount++;
                lidarrLogs[logId] = albumLog;
                continue;
            }

            // STEP 1: Get MusicBrainz IDs (with fallback using artist/album names)
            const musicBrainzIds = await getMusicBrainzIds(album.spotify_album_id, album.artist_name, album.album_name);

            if (!musicBrainzIds) {
                albumLog.status = 'not_found';
                albumLog.error = 'No MusicBrainz mapping found';
                albumLog.end = Date.now();
                notFoundCount++;
                lidarrLogs[logId] = albumLog;
                continue;
            }

            const { releaseGroupId, artistId } = musicBrainzIds;
            albumLog.musicbrainz_album_id = releaseGroupId;
            albumLog.musicbrainz_artist_id = artistId;

            // STEP 2: Lookup album in Lidarr using MusicBrainz ID
            const baseUrl = settings.url.endsWith('/') ? settings.url.slice(0, -1) : settings.url;
            const lidarrAlbum = await lookupLidarrAlbum(releaseGroupId, settings.url, apiKey);

            if (!lidarrAlbum?.artist) {
                albumLog.status = 'not_found';
                albumLog.error = 'Album not found in Lidarr database';
                albumLog.end = Date.now();
                notFoundCount++;
                lidarrLogs[logId] = albumLog;
                continue;
            }

            // STEP 3: Add to Lidarr (this part remains the same)
            const addRequest: LidarrAddAlbumRequest = {
                foreignAlbumId: lidarrAlbum.foreignAlbumId,
                title: lidarrAlbum.title,
                artistId: 0,
                profileId: settings.quality_profile_id,
                qualityProfileId: settings.quality_profile_id,
                metadataProfileId: settings.metadata_profile_id,
                monitored: true,
                anyReleaseOk: true,
                rootFolderPath: settings.root_folder_path,
                addOptions: {
                    searchForNewAlbum: true,
                },
                artist: {
                    foreignArtistId: lidarrAlbum.artist.foreignArtistId,
                    artistName: lidarrAlbum.artist.artistName,
                    qualityProfileId: settings.quality_profile_id,
                    metadataProfileId: settings.metadata_profile_id,
                    rootFolderPath: settings.root_folder_path,
                },
            };

            const addUrl = `${baseUrl}/api/v1/album`;
            await axios.post(addUrl, addRequest, {
                headers: {
                    'X-Api-Key': apiKey,
                    'Content-Type': 'application/json',
                },
            });

            albumLog.status = 'success';
            albumLog.end = Date.now();
            successCount++;
            lidarrLogs[logId] = albumLog;

        } catch (error: any) {
            const result = error.response?.data[0];

            const albumExists = error.response?.status === 409 || result?.errorCode == 'AlbumExistsValidator';
            if (albumExists) {
                albumLog.status = 'success';
                albumLog.error = 'Album already exists in Lidarr';
                continue;
            } else {
                albumLog.status = 'error';
                albumLog.error = error.message;
                errorCount++;
            }

            albumLog.end = Date.now();
            lidarrLogs[logId] = albumLog;
        }

        await new Promise(resolve => {
            setTimeout(resolve, 1000); // Increased from 500ms to 1000ms for MusicBrainz rate limit
        });
    }

    // Save Lidarr logs
    writeFileSync(lidarrLogsPath, JSON.stringify(lidarrLogs, null, 2));

    // Complete sync log
    logComplete(syncLog);

    console.log(`Lidarr sync complete: ${successCount} success, ${notFoundCount} not found, ${errorCount} errors`);
}

function run() {
    syncLidarr()
        .then(() => {
            completeSyncType('lidarr');
        })
        .catch((e: unknown) => {
            const message = e instanceof Error ? e.message : 'Unknown error';
            errorSyncType('lidarr', message);
        });
}

// Only run if this file is executed directly, not when imported
// eslint-disable-next-line unicorn/prefer-module
if (require.main === module) {
    run();
}
