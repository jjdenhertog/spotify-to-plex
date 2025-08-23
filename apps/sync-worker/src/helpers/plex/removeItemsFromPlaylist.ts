import getAPIUrl from '../getAPIUrl';
import { plex } from '../../library/plex';
import {
    removeItemsFromPlaylist as removeItemsFromPlaylistCore,
    PlexSettings,
    PlaylistItem,
    RetryConfig
} from '@spotify-to-plex/plex-helpers';
import { AxiosRequest } from '@spotify-to-plex/http-client';

/**
 * Legacy wrapper for removeItemsFromPlaylist - maintains backward compatibility
 * Note: Original function only cleared entire playlist, not specific items
 * @deprecated Use removeItemsFromPlaylistWithSettings or clearPlaylistWithSettings instead
 */
export async function removeItemsFromPlaylist(id: string): Promise<void> {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    const url = getAPIUrl(plex.settings.uri, `/playlists/${id}/items`);
    await AxiosRequest.delete(url, plex.settings.token);
}

/**
 * Modern version that removes specific items from playlist
 */
export async function removeItemsFromPlaylistWithSettings(
    settings: PlexSettings,
    playlistId: string,
    items: PlaylistItem[],
    config?: RetryConfig
): Promise<void> {
    return removeItemsFromPlaylistCore(settings, getAPIUrl, playlistId, items, config);
}

/**
 * Clears all items from a playlist (matches legacy behavior)
 */
export async function clearPlaylistWithSettings(
    settings: PlexSettings,
    playlistId: string
): Promise<void> {
    const url = getAPIUrl(settings.uri, `/playlists/${playlistId}/items`);
    await AxiosRequest.delete(url, settings.token);
}