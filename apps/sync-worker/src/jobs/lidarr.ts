import { getLidarrSettings } from "@spotify-to-plex/plex-config/functions/getLidarrSettings";
import { getStorageDir } from "@spotify-to-plex/shared-utils/utils/getStorageDir";
import { LidarrAlbumData, LidarrSearchResult, LidarrAddAlbumRequest, LidarrSyncLog } from "@spotify-to-plex/shared-types/common/lidarr";
import axios from "axios";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSyncLogs } from "../utils/getSyncLogs";

export async function syncLidarr() {
    console.log('Starting Lidarr sync...');

    // Check Lidarr settings
    const settings = await getLidarrSettings();
    if (!settings.enabled) {
        console.log('Lidarr is not enabled. Skipping sync.');

        return;
    }

    if (!settings.url) {
        console.error('Lidarr URL is not configured.');

        return;
    }

    const apiKey = process.env.LIDARR_API_KEY;
    if (!apiKey) {
        console.error('LIDARR_API_KEY environment variable is not set.');

        return;
    }

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

    if (albums.length === 0) {
        console.log('No albums to sync.');

        return;
    }

    console.log(`Found ${albums.length} albums to sync.`);

    // Initialize logs
    const { putLog, logComplete } = getSyncLogs();
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
            console.log(`Processing: ${album.artist_name} - ${album.album_name}`);

            // Step 1: Search Lidarr
            const baseUrl = settings.url.endsWith('/') ? settings.url.slice(0, -1) : settings.url;
            const searchTerm = `${album.artist_name} ${album.album_name}`;
            const searchUrl = `${baseUrl}/api/v1/search?term=${encodeURIComponent(searchTerm)}`;

            const searchResponse = await axios.get<LidarrSearchResult[]>(searchUrl, {
                headers: {
                    'X-Api-Key': apiKey,
                },
            });

            if (!searchResponse.data || searchResponse.data.length === 0) {
                console.log(`  No results found for: ${searchTerm}`);
                albumLog.status = 'not_found';
                albumLog.error = 'No search results found';
                albumLog.end = Date.now();
                notFoundCount++;
                lidarrLogs[logId] = albumLog;
                continue;
            }

            // Find the best match (first album result)
            const albumResult = searchResponse.data.find(result => result.album);
            if (!albumResult?.album?.artist) {
                console.log(`  No album match found for: ${searchTerm}`);
                albumLog.status = 'not_found';
                albumLog.error = 'No album in search results';
                albumLog.end = Date.now();
                notFoundCount++;
                lidarrLogs[logId] = albumLog;
                continue;
            }

            const { foreignAlbumId, title, artist } = albumResult.album;
            const { foreignArtistId, artistName } = artist;

            console.log(`  Found: ${title} (Album ID: ${foreignAlbumId})`);

            albumLog.musicbrainz_album_id = foreignAlbumId;
            albumLog.musicbrainz_artist_id = foreignArtistId;

            // Step 2: Add to Lidarr
            const addRequest: LidarrAddAlbumRequest = {
                foreignAlbumId,
                title,
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
                    foreignArtistId,
                    artistName,
                    qualityProfileId: settings.quality_profile_id,
                    metadataProfileId: settings.metadata_profile_id,
                    rootFolderPath: settings.root_folder_path,
                },
            };

            const addUrl = `${baseUrl}/api/v1/album`;
            const addResponse = await axios.post(addUrl, addRequest, {
                headers: {
                    'X-Api-Key': apiKey,
                    'Content-Type': 'application/json',
                },
            });

            console.log(`  Successfully added to Lidarr: ${addResponse.data.title}`);
            albumLog.status = 'success';
            albumLog.end = Date.now();
            successCount++;
            lidarrLogs[logId] = albumLog;

        } catch (error: any) {
            console.error(`  Error processing album: ${error.message}`);


            // Check if album already exists (409 conflict)

            const result = error.response?.data[0];

            const albumExists = error.response?.status === 409 || result?.errorCode == 'AlbumExistsValidator';
            if (albumExists) {

                albumLog.status = 'success';
                albumLog.error = 'Album already exists in Lidarr';
                console.log(`  Album already exists: ${album.album_name}`);
                continue;
            } else {
                albumLog.status = 'error';
                albumLog.error = error.message;
                errorCount++;
            }

            albumLog.end = Date.now();
            lidarrLogs[logId] = albumLog;
        }

        // Small delay between requests
        await new Promise(resolve => {
            setTimeout(resolve, 500);
        });
    }

    // Save Lidarr logs
    writeFileSync(lidarrLogsPath, JSON.stringify(lidarrLogs, null, 2));

    // Complete sync log
    logComplete(syncLog);

    console.log(`Lidarr sync complete: ${successCount} success, ${notFoundCount} not found, ${errorCount} errors`);
}

function run() {
    console.log('Start Lidarr sync');
    syncLidarr()
        .then(() => {
            console.log('Lidarr sync complete');
        })
        .catch((e: unknown) => {
            console.error('Lidarr sync failed:', e);
        });
}

run();
