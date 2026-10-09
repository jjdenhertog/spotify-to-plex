import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { getCachedTrackLinks } from "@spotify-to-plex/shared-utils/cache/getCachedTrackLink";
import { setCredentials } from "../session/credentials";
import { TidalMusicSearchApproach } from "../types/TidalMusicSearchApproach";
import { TidalMusicSearchTrack } from "../types/TidalMusicSearchTrack";
import { TidalCredentials } from "../types/TidalCredentials";
import { TidalLookup } from "../types/TidalLookup";
import { search } from "./search";

/**
 * Finds tracks on Tidal, cached track links first, then a search for the rest.
 * New matches are added to the track links cache, misses are not cached.
 *
 * Only tracks with a match are returned: the cached ones first, then the searched ones.
 * Throws when the Tidal search fails (e.g. authentication).
 */
export async function findTidalTracks(credentials: TidalCredentials, tracks: TidalMusicSearchTrack[], searchApproaches?: TidalMusicSearchApproach[]) {

    // Caching
    const { add, found: cachedTidalLinks } = getCachedTrackLinks(tracks, 'tidal');
    const result: TidalLookup[] = [];

    for (let i = 0; i < tracks.length; i++) {
        const searchItem = tracks[i];
        if (!searchItem?.id)
            continue;

        // Process if no cached link has been found
        const trackLink = cachedTidalLinks.find(item => item.spotify_id == searchItem.id);
        const tidalIds = trackLink?.tidal_id;
        if (!tidalIds || tidalIds.length == 0)
            continue;

        result.push({ id: searchItem.id, tidal_ids: tidalIds });
    }

    const toSearchTidalTracks = tracks.filter(item => !result.some(track => track.id == item.id));
    if (toSearchTidalTracks.length > 0) {

        console.log(`Search for ${toSearchTidalTracks.length} tracks on Tidal`);

        // Set client credentials for Tidal API (no user OAuth needed)
        setCredentials(credentials.clientId, credentials.clientSecret);

        // Load music search configuration
        const musicSearchConfig = await getMusicSearchConfig();
        const approaches = searchApproaches ?? musicSearchConfig.searchApproaches;
        if (!approaches || approaches.length === 0)
            throw new Error(`Search approaches not found`)

        const tidalConfig = {
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            musicSearchConfig,
            searchApproaches: approaches
        };

        const foundTracks = await search(tidalConfig, toSearchTidalTracks);

        for (let i = 0; i < toSearchTidalTracks.length; i++) {
            const track = toSearchTidalTracks[i];
            if (!track?.id)
                continue;

            const tidalData = foundTracks.find(item => item.id == track.id);
            const [bestMatch] = tidalData?.result ?? [];
            if (tidalData && bestMatch?.id)
                result.push({ id: track.id, tidal_ids: tidalData.result.map(item => item.id), track: bestMatch });
        }

        add(foundTracks, 'tidal');
    }

    return result;
}
