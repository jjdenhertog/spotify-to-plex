import { getCachedTrackLinks } from "@spotify-to-plex/shared-utils/cache/getCachedTrackLink";
import { durationSimilarity } from "@spotify-to-plex/shared-utils/music/durationSimilarity";
import { GetSpotifyAlbum } from "@spotify-to-plex/shared-types/spotify/GetSpotifyAlbum";
import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { TrackLink } from "@spotify-to-plex/shared-types/common/track";
import { PlexTrack } from "@spotify-to-plex/plex-music-search/types/PlexTrack";
import { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import { getById } from "@spotify-to-plex/plex-music-search/functions/getById";
import { PlexMusicSearchConfig } from "@spotify-to-plex/plex-music-search/types/PlexMusicSearchConfig";

// Below this the cached track is a different version, not a different encode
const DURATION_THRESHOLD = 0.65;

// Loads the cached plex tracks for one link, dropping any whose duration
// contradicts the spotify track. Returns the ids worth keeping in the cache:
// a rejected id is dropped, but an id we simply failed to load is kept -
// plex being briefly unreachable is no reason to delete a good link.
async function loadLinkedTracks(config: PlexMusicSearchConfig, trackLink: TrackLink, title: string, durationMs?: number) {
    const tracks: PlexTrack[] = [];
    const keptIds: string[] = [];

    for (const plexId of trackLink.plex_id ?? []) {
        try {
            const metaData = await getById(config, plexId);
            const similarity = durationSimilarity(durationMs, metaData.duration_ms);

            if (!trackLink.manual && similarity && similarity < DURATION_THRESHOLD) {
                console.log(`Dropping cached link for "${title}": duration mismatch (${Math.round(similarity * 100)}%)`);
                continue;
            }

            keptIds.push(plexId);
            tracks.push(metaData);
        } catch (_e) {
            keptIds.push(plexId);
        }
    }

    return { tracks, keptIds };
}

export async function getCachedPlexTracks(plexSearchConfig: PlexMusicSearchConfig, data: GetSpotifyPlaylist | GetSpotifyAlbum) {
    const { add, found: cachedTrackLinks } = getCachedTrackLinks(data.tracks, 'plex');
    const result: SearchResponse[] = [];

    for (let i = 0; i < data.tracks.length; i++) {
        const searchItem = data.tracks[i];
        if (!searchItem?.id)
            continue;

        // Process if no cached link has been found
        const trackLink = cachedTrackLinks.find(item => item.spotify_id == searchItem.id);
        if (!trackLink?.plex_id || trackLink.plex_id?.length == 0)
            continue;

        const { tracks, keptIds } = await loadLinkedTracks(plexSearchConfig, trackLink, searchItem.title, searchItem.duration_ms)

        // Persisted by the add() that follows the re-search a drop triggers
        if (keptIds.length !== trackLink.plex_id.length)
            trackLink.plex_id = keptIds;

        // Try searching again if no tracks are found
        if (tracks.length == 0)
            continue;

        // Add the result
        result.push({
            id: searchItem.id,
            title: searchItem.title,
            artist: searchItem.artists?.[0] || 'Unknown',
            album: searchItem.album || "",
            result: tracks
        });
    }

    return { add, result };
}
