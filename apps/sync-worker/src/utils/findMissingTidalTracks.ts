import { getCachedTrackLinks } from "@spotify-to-plex/shared-utils/cache/getCachedTrackLink";
import { getTidalCredentials } from "@spotify-to-plex/shared-utils/tidal/getTidalCredentials";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";
import { search as tidalMusicSearch } from "@spotify-to-plex/tidal-music-search/functions/search";
import { setUser } from "@spotify-to-plex/tidal-music-search/functions/setUser";
import type { SearchResponse } from "@spotify-to-plex/tidal-music-search/functions/search";
import { settingsDir } from "@spotify-to-plex/shared-utils/utils/settingsDir";
import { getMusicSearchConfigFromStorage } from "@spotify-to-plex/music-search/functions/getMusicSearchConfigFromStorage";

export async function findMissingTidalTracks(missingTracks: Track[]) {

    if (typeof process.env.TIDAL_API_CLIENT_ID != 'string' || typeof process.env.TIDAL_API_CLIENT_SECRET != 'string')
        return [];

    // Caching
    const { add, found: cachedTidalLinks } = getCachedTrackLinks(missingTracks, 'tidal', settingsDir);
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

        // Credentials
        const tidalUser = await getTidalCredentials();
        
        // Load music search configuration
        let musicSearchConfig;
        try {
            musicSearchConfig = await getMusicSearchConfigFromStorage(settingsDir);
        } catch (error) {
            // Fallback to default config if error loading
            console.warn('Failed to load music search config, using defaults:', error);
        }

        // Set up Tidal user
        setUser(tidalUser);

        const tidalSearchResponse = await tidalMusicSearch({
            clientId: process.env.TIDAL_API_CLIENT_ID,
            clientSecret: process.env.TIDAL_API_CLIENT_SECRET,
            musicSearchConfig,
        }, toSearchTidalTracks);

        for (let i = 0; i < toSearchTidalTracks.length; i++) {
            const track = toSearchTidalTracks[i];
            if (!track?.id)
                continue;

            const tidalData = tidalSearchResponse.find((item: SearchResponse) => item.id == track.id);
            if (tidalData?.result?.[0]?.id) {
                result.push({ id: track.id, tidal_id: tidalData.result[0].id });
            }
        }

        add(tidalSearchResponse, 'tidal');
    }

    return result;
}
