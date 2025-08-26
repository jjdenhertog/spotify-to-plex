import { getAPIUrl } from '@spotify-to-plex/shared-utils/server';
import { plex } from '@/library/plex';
import {
    removeItemsFromPlaylist as removeItemsFromPlaylistCore,
    PlexSettings,
    PlaylistItem,
    RetryConfig
} from '@spotify-to-plex/plex-helpers';
import { AxiosRequest } from '@spotify-to-plex/http-client';

/**
 * Convenience wrapper for removeItemsFromPlaylist
 * Note: Original function only cleared entire playlist, not specific items
 */
export async function removeItemsFromPlaylist(id: string): Promise<void> {
    const settings = await plex.getSettings();
    if (!settings.uri || !settings.token)
        throw new Error('No Plex connection found');

    const url = getAPIUrl(settings.uri, `/playlists/${id}/items`);
    await AxiosRequest.delete(url, settings.token);
}

/**
 * Version that removes specific items from playlist
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