import { Track } from "@spotify-to-plex/shared-types/spotify/Track";
import { findTidalTracks } from "@spotify-to-plex/tidal-music-search/functions/findTidalTracks";
import { getTidalCredentials } from "@spotify-to-plex/tidal-music-search/functions/getTidalCredentials";

export async function findMissingTidalTracks(missingTracks: Track[]) {

    const credentials = getTidalCredentials();
    if (!credentials)
        return [];

    // Cached track links first, then a Tidal search for the rest
    const found = await findTidalTracks(credentials, missingTracks);
    const result: { id: string; tidal_id: string; }[] = [];

    for (let i = 0; i < found.length; i++) {
        const item = found[i];
        const [firstTidalId] = item?.tidal_ids ?? [];
        if (item && firstTidalId)
            result.push({ id: item.id, tidal_id: firstTidalId });
    }

    return result;
}
