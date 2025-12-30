import { TrackLink } from './types';

/**
 * Find Plex ID for an album by Spotify ID
 * Returns the first plex_id if available
 */
export function findAlbumPlexId(spotifyId: string, trackLinks: TrackLink[]) {
    const link = trackLinks.find(item => item.spotify_id === spotifyId);

    if (!link?.plex_id || link.plex_id.length === 0) 
        return null;

    return link.plex_id[0] ?? null;
}
