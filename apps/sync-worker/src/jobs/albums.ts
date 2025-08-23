import { settingsDir } from "../library/settingsDir";
import { plex } from "../library/plex";
import { PlexMusicSearch, SearchResponse } from "@spotify-to-plex/plex-music-search";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { findMissingTidalAlbums } from "../utils/findMissingTidalAlbums";
import { getCachedPlexTracks } from "../utils/getCachedPlexTracks";
import { getSavedAlbums } from "../utils/getSavedAlbums";
import { getSyncLogs } from "../utils/getSyncLogs";
import { loadSpotifyData } from "../utils/loadSpotifyData";


export async function syncAlbums() {

    // Check if we need to force syncing
    const args = process.argv.slice(2);
    const force = args.includes("force")

    const { toSyncAlbums } = getSavedAlbums()
    const { putLog, logError, logComplete } = getSyncLogs()

    if (!plex.settings.uri || !plex.settings.token)
        throw new Error("No plex connection found")

    const missingSpotifyAlbums: string[] = []
    const missingTidalAlbums: string[] = []

    for (let i = 0; i < toSyncAlbums.length; i++) {
        const item = toSyncAlbums[i];
        if (!item) continue;

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
        // Initiate the plexMusicSearch
        //////////////////////////////////////
        const plexMusicSearch = new PlexMusicSearch({
            uri: plex.settings.uri,
            token: plex.settings.token,
        })
        const result = await plexMusicSearch.searchAlbum(data.tracks)
        const { add } = await getCachedPlexTracks(plexMusicSearch, data)

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
        writeFileSync(join(settingsDir, 'missing_albums_spotify.txt'), missingSpotifyAlbums.map(id => `https://open.spotify.com/album/${id}`).join('\n'))
        writeFileSync(join(settingsDir, 'missing_albums_tidal.txt'), missingTidalAlbums.map(id => `https://tidal.com/browse/album/${id}`).join('\n'))
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