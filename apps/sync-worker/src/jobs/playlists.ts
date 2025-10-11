import { AxiosRequest } from "@spotify-to-plex/http-client/AxiosRequest";
import { getAPIUrl } from "@spotify-to-plex/shared-utils/utils/getAPIUrl";
import { getStorageDir } from "@spotify-to-plex/shared-utils/utils/getStorageDir";
import { handleOneRetryAttempt } from "@spotify-to-plex/plex-helpers/retry";
import { Playlist } from "@spotify-to-plex/shared-types/plex/Playlist";
import { GetPlaylistResponse } from "@spotify-to-plex/shared-types/plex/GetPlaylistResponse";
import { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import { search as plexMusicSearch } from "@spotify-to-plex/plex-music-search/functions/search";
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { findMissingTidalTracks } from "../utils/findMissingTidalTracks";
import { getCachedPlexTracks } from "../utils/getCachedPlexTracks";
import { getPlexPlaylists } from "../utils/getPlexPlaylists";
import { getSavedPlaylists } from "../utils/getSavedPlaylists";
import { getNestedSyncLogsForType } from "../utils/getNestedSyncLogsForType";
import { startSyncType } from "../utils/startSyncType";
import { clearSyncTypeLogs } from "../utils/clearSyncTypeLogs";
import { completeSyncType } from "../utils/completeSyncType";
import { errorSyncType } from "../utils/errorSyncType";
import { loadSpotifyData } from "../utils/loadSpotifyData";
import { putPlexPlaylist } from "../utils/putPlexTracks";
import { getSettings } from "@spotify-to-plex/plex-config/functions/getSettings";
import { LidarrAlbumData } from "@spotify-to-plex/shared-types/common/lidarr";


export async function syncPlaylists() {

    // Start sync type logging
    startSyncType('playlists');
    clearSyncTypeLogs('playlists');

    // Check if we need to force syncing
    const args = process.argv.slice(2);
    const force = args.includes("force")

    const { toSyncPlaylists } = getSavedPlaylists()
    const { putLog, logError, logComplete } = getNestedSyncLogsForType('playlists')

    const settings = await getSettings();
    if (!settings.uri || !settings.token)
        throw new Error("No plex connection found")

    const { playlists } = await getPlexPlaylists()

    const missingSpotifyTracks: string[] = []
    const missingTidalTracks: string[] = []
    const missingAlbumsLidarr: LidarrAlbumData[] = []

    for (let i = 0; i < toSyncPlaylists.length; i++) {
        const item = toSyncPlaylists[i];
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

        try {

            const nextSyncAfter = new Date((itemLog.end || 0) + (days * 24 * 60 * 60 * 1000));
            if (nextSyncAfter.getTime() > Date.now() && !force) {
                console.log(`Next sync on: ${nextSyncAfter.toString()}`)
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

            console.log(`---- Syncing ${data.title} ----`)
            //////////////////////////////////
            // Load Plex Playlists if it exists
            //////////////////////////////////
            // eslint-disable-next-line unicorn/consistent-destructuring
            const foundPlaylist = playlists.find(item => item.id == id)
            let plexPlaylist: Playlist | undefined | null = null
            if (foundPlaylist) {
                if (!settings.uri || !settings.token) {
                    throw new Error('Plex settings not configured properly');
                }

                const url = getAPIUrl(settings.uri, `/playlists`);
                const result = await handleOneRetryAttempt<GetPlaylistResponse>(() => AxiosRequest.get(url, settings.token));
                
                // eslint-disable-next-line unicorn/consistent-destructuring
                plexPlaylist = result.data.MediaContainer.Metadata.find((item: Playlist) => item.ratingKey == foundPlaylist.plex)
            }

            //////////////////////////////////////
            // Load music search configuration
            //////////////////////////////////////
            const musicSearchConfig = await getMusicSearchConfig();
            if(!musicSearchConfig)
                throw new Error(`Music search config not found`)

            const {searchApproaches} = musicSearchConfig;
            if(!searchApproaches || searchApproaches.length === 0)
                throw new Error(`Search approaches not found`)

            const plexSearchConfig = {
                uri: settings.uri,
                token: settings.token,
                musicSearchConfig,
                searchApproaches
            };

            // @ts-ignore
            // eslint-disable-next-line prefer-const
            let { result, add } = await getCachedPlexTracks(plexSearchConfig, data)

            // eslint-disable-next-line unicorn/consistent-destructuring
            const toSearchItems = data.tracks.filter(track => !result.some((item: SearchResponse) => item.id == track.id))
            if (toSearchItems.length > 0) {
                console.log(`Searching for ${toSearchItems.length} tracks`)
                const searchResult = await plexMusicSearch(plexSearchConfig, toSearchItems)
                result = result.concat(searchResult)

                add(searchResult, 'plex')
            }

            ////////////
            // Put plex playlist
            ////////////
            await putPlexPlaylist(id, plexPlaylist, result, title, data.image)

            ////////////
            // Handle missing tracks
            ////////////
            const missingTracks = toSearchItems.filter(item => {
                const { title: trackTitle, artists: trackArtists } = item;

                return result.some(track => track.title == trackTitle && trackArtists.indexOf(track.artist) > - 1 && track.result.length == 0)
            })
            if (missingTracks.length == 0) {
                logComplete(itemLog)
                continue;
            }

            console.log(`Missing ${missingTracks.length} tracks`)
            missingTracks.forEach(item => {
                const id = item.id.indexOf(":") > -1 ? item.id.split(":")[2] : item.id;
                if (typeof id === 'string' && !missingSpotifyTracks.includes(id))
                    missingSpotifyTracks.push(id)
            })

            const tidalTracks = await findMissingTidalTracks(missingTracks)
            tidalTracks.forEach(item => {
                if (!missingTidalTracks.includes(item.tidal_id))
                    missingTidalTracks.push(item.tidal_id)
            })

            // Collect unique albums for Lidarr
            missingTracks.forEach(track => {
                const artist = track.artists[0] || 'Unknown Artist';
                const album = track.album || 'Unknown Album';
                const key = `${artist}|${album}`;

                // Check if album already exists in the array
                if (!missingAlbumsLidarr.some(item => `${item.artist_name}|${item.album_name}` === key)) {
                    missingAlbumsLidarr.push({
                        artist_name: artist,
                        album_name: album,
                        spotify_album_id: track.id
                    });
                }
            });

            /////////////////////////////
            // Store logs
            /////////////////////////////
            logComplete(itemLog)

            // Store missing tracks
            writeFileSync(join(getStorageDir(), 'missing_tracks_spotify.txt'), missingSpotifyTracks.map(id => `https://open.spotify.com/track/${id}`).join('\n'))
            writeFileSync(join(getStorageDir(), 'missing_tracks_tidal.txt'), missingTidalTracks.map(id => `https://tidal.com/browse/track/${id}`).join('\n'))
            writeFileSync(join(getStorageDir(), 'missing_tracks_lidarr.json'), JSON.stringify(missingAlbumsLidarr, null, 2))

        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            logError(itemLog, `Something went wrong while syncing: ${message}`)
        }

    }

}


function run() {
    console.log(`Start syncing items`)
    syncPlaylists()
        .then(() => {
            completeSyncType('playlists');
            console.log(`Sync complete`)
        })
        .catch((e: unknown) => {
            const message = e instanceof Error ? e.message : 'Unknown error';
            errorSyncType('playlists', message);
            console.log(e)
        })
}

run();