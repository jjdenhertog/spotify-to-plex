import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { searchAlbum } from "@spotify-to-plex/plex-music-search/functions/searchAlbum";
import { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { findMissingTidalAlbums } from "../utils/findMissingTidalAlbums";
import { getCachedPlexTracks } from "../utils/getCachedPlexTracks";
import { getSavedAlbums } from "../utils/getSavedAlbums";
import { getSyncLogs } from "../utils/getSyncLogs";
import { loadSpotifyData } from "../utils/loadSpotifyData";
import { getSettings } from "@spotify-to-plex/plex-config/functions/getSettings";

export async function syncAlbums() {

    // Check if we need to force syncing
    const args = process.argv.slice(2);
    const force = args.includes("force")

    const { toSyncAlbums } = getSavedAlbums()
    const { putLog, logError, logComplete } = getSyncLogs()

    const settings = await getSettings();
    if (!settings.uri || !settings.token)
        throw new Error("No plex connection found")

    const missingSpotifyAlbums: string[] = []
    const missingTidalAlbums: string[] = []

    for (let i = 0; i < toSyncAlbums.length; i++) {
        const item = toSyncAlbums[i];
        if (!item)
            continue;

        const { id, title, uri, user, sync_interval } = item;

        //////////////////////////////////
        // Load Plex playlist
        //////////////////////////////////
        const itemLog = putLog(id, title)
        let days = Number(sync_interval)
        if (isNaN(days))
            days = 0;

        const nextSyncAfter = new Date((itemLog.end || 0) + (days * 24 * 60 * 60 * 1000));
        if (nextSyncAfter.getTime() > Date.now() && !force) {
            console.log(`Next sync on: ${nextSyncAfter.toDateString()}`)
            continue;
        }

        //////////////////////////////////
        // Load Spotify Data
        //////////////////////////////////
        const data = await loadSpotifyData(uri, user)
        if (!data) {
            logError(itemLog, `Spotify data could not be loaded`)
            continue;
        }

        //////////////////////////////////////
        // Load music search configuration and search
        //////////////////////////////////////
        const musicSearchConfig = await getMusicSearchConfig();
        const plexConfig = {
            uri: settings.uri,
            token: settings.token,
            musicSearchConfig,
        };
        const result = await searchAlbum(plexConfig, data.tracks);

        //@ts-ignore
        const { add } = await getCachedPlexTracks(plexConfig, data);

        const missingTracks = data.tracks.filter(item => {
            const { title: trackTitle, artists: trackArtists } = item;

            return result.some((track: SearchResponse) => track.title == trackTitle && trackArtists.indexOf(track.artist) > - 1 && track.result.length == 0)
        })

        if (!result.some((item: SearchResponse) => item.result.length == 0)) {
            logComplete(itemLog);

            // Store album id
            add(result, 'plex', { id: data.id })
            continue;
        }

        if (!missingSpotifyAlbums.includes(data.id))
            missingSpotifyAlbums.push(data.id)

        console.log(`Some tracks on the album seem to be missing ${data.tracks.length}/ ${missingTracks.length}: ${data.title}`)
        const tidalIds = await findMissingTidalAlbums(missingTracks)
        tidalIds.forEach(tidalId => {
            if (!missingTidalAlbums.includes(tidalId))
                missingTidalAlbums.push(tidalId)
        })

        /////////////////////////////
        // Store logs
        /////////////////////////////
        logComplete(itemLog)

        // Store the missing albums
        writeFileSync(join(getStorageDir(), 'missing_albums_spotify.txt'), missingSpotifyAlbums.map(id => `https://open.spotify.com/album/${id}`).join('\n'))
        writeFileSync(join(getStorageDir(), 'missing_albums_tidal.txt'), missingTidalAlbums.map(id => `https://tidal.com/browse/album/${id}`).join('\n'))
    }


}


function run() {
    console.log(`Start syncing items`)
    syncAlbums()
        .then(() => {
            console.log(`Sync complete`)
        })
        .catch((e: unknown) => {
            console.log(e)
        })
}

export type SyncLog = {
    id: string
    title: string
    start: number
    end?: number
    error?: string
}

run();