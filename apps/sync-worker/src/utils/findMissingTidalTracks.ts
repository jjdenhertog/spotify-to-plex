import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";
import { getCachedTrackLinks } from "@spotify-to-plex/shared-utils/cache/getCachedTrackLink";
import { SearchResponse } from "@spotify-to-plex/tidal-music-search/types/SearchResponse";
import { search } from "@spotify-to-plex/tidal-music-search/functions/search";
import { setCredentials } from "@spotify-to-plex/tidal-music-search/session/credentials";

export async function findMissingTidalTracks(missingTracks: Track[]) {

    if (typeof process.env.TIDAL_API_CLIENT_ID != 'string' || typeof process.env.TIDAL_API_CLIENT_SECRET != 'string')
        return [];

    // Caching
    const { add, found: cachedTidalLinks } = getCachedTrackLinks(missingTracks, 'tidal');
    const result: { id: string; tidal_id: string; }[] = [];

    for (let i = 0; i < missingTracks.length; i++) {
        const searchItem = missingTracks[i];
        if (!searchItem?.id)
            continue;

        // Process if no cached link has been found
        const trackLink = cachedTidalLinks.find(item => item.spotify_id == searchItem.id);
        const tidalIds = trackLink?.tidal_id;
        if (!tidalIds || tidalIds.length == 0)
            continue;

        const [firstTidalId] = tidalIds;
        if (firstTidalId) {
            result.push({ id: searchItem.id, tidal_id: firstTidalId });
        }
    }

    const toSearchTidalTracks = missingTracks.filter(item => !result.some(track => track.id == item.id));
    if (toSearchTidalTracks.length > 0) {

        console.log(`Search for ${toSearchTidalTracks.length} tracks on Tidal`);

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

        const foundTracks= await search(tidalConfig, toSearchTidalTracks);

        for (let i = 0; i < toSearchTidalTracks.length; i++) {
            const track = toSearchTidalTracks[i];
            if (!track?.id)
                continue;

            const tidalData = foundTracks.find((item: SearchResponse) => item.id == track.id);
            if (tidalData?.result?.[0]?.id) {
                // result.push({ id: track.id, tidal_id: tidalData.result[0].id });
                result.push({ id: track.id, tidal_id: tidalData?.result?.[0]?.id })
            }
        }

        add(foundTracks, 'tidal');
    }

    return result;
}
