import { getAPIUrl } from '@spotify-to-plex/shared-utils/server';
import { plex } from '../../library/plex';
import {
    addItemsToPlaylist as addItemsToPlaylistCore,
    PlexSettings,
    PlaylistItem,
    RetryConfig
} from '@spotify-to-plex/plex-helpers';

/**
 * Convenience wrapper for addItemsToPlaylist
 */
export async function addItemsToPlaylist(
    id: string,
    items: { key: string; source?: string; }[]
): Promise<void> {
    const settings = await plex.getSettings();
    if (!settings.uri || !settings.token || !settings.id) {
        throw new Error('Plex settings not configured properly');
    }

    return addItemsToPlaylistCore(settings as Required<typeof settings>, getAPIUrl, id, items);
}

/**
 * Version that accepts settings as parameter
 */
export async function addItemsToPlaylistWithSettings(
    settings: PlexSettings,
    playlistId: string,
    items: PlaylistItem[],
    config?: RetryConfig
): Promise<void> {
    return addItemsToPlaylistCore(settings, getAPIUrl, playlistId, items, config);
}