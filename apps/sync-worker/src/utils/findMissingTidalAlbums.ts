import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";
import { searchAlbum } from "@spotify-to-plex/tidal-music-search/functions/searchAlbum";
import { setCredentials } from "@spotify-to-plex/tidal-music-search/session/credentials";

export async function findMissingTidalAlbums(missingTracks: Track[]) {

    if (typeof process.env.TIDAL_API_CLIENT_ID != 'string' || typeof process.env.TIDAL_API_CLIENT_SECRET != 'string')
        return [];

    console.log(`Search for ${missingTracks.length} tracks on Tidal`);

    // Set client credentials for Tidal API (no user OAuth needed)
    setCredentials(process.env.TIDAL_API_CLIENT_ID, process.env.TIDAL_API_CLIENT_SECRET);

    // Load music search configuration
    const musicSearchConfig = await getMusicSearchConfig();
    const { searchApproaches } = musicSearchConfig;
    if (!searchApproaches || searchApproaches.length === 0)
        throw new Error(`Search approaches not found`)

    const tidalConfig = {
        clientId: process.env.TIDAL_API_CLIENT_ID,
        clientSecret: process.env.TIDAL_API_CLIENT_SECRET,
        musicSearchConfig,
        searchApproaches
    };

    const firstWithAlbum = missingTracks.find(item => !!item.album)
    if (!firstWithAlbum)
        return []

    const results = await searchAlbum(tidalConfig, [firstWithAlbum]);

    const albumIds: string[] = []
    results.forEach((result) => {
        result.result.forEach(item => {
            if (!albumIds.includes(item.album.id))
                albumIds.push(item.album.id)
        })
    })

    return albumIds;

}
