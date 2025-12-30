import { PlaylistData } from '@spotify-to-plex/shared-types/dashboard/PlaylistData';

/**
 * Find Plex ID for a playlist by Spotify ID
 */
export function findPlaylistPlexId(spotifyId: string, playlists: PlaylistData) {
    const playlist = playlists.data.find(item => item.id === spotifyId);

    return playlist?.plex || null;
}
