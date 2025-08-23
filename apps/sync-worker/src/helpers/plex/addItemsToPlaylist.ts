import getAPIUrl from '../getAPIUrl';
import { plex } from '../../library/plex';
import {
    addItemsToPlaylist as addItemsToPlaylistCore,
    PlexSettings,
    PlaylistItem,
    RetryConfig
} from '@spotify-to-plex/plex-helpers';

/**
 * Legacy wrapper for addItemsToPlaylist - maintains backward compatibility
 * @deprecated Use addItemsToPlaylistWithSettings instead
 */
export async function addItemsToPlaylist(
    id: string,
    items: { key: string; source?: string; }[]
): Promise<void> {
    return addItemsToPlaylistCore(plex.settings, getAPIUrl, id, items);
}

/**
 * Modern version that accepts settings as parameter
 */
export async function addItemsToPlaylistWithSettings(
    settings: PlexSettings,
    playlistId: string,
    items: PlaylistItem[],
    config?: RetryConfig
): Promise<void> {
    return addItemsToPlaylistCore(settings, getAPIUrl, playlistId, items, config);
}