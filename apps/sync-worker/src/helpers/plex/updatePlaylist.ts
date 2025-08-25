import getAPIUrl from '../getAPIUrl';
import { plex } from '../../library/plex';
import {
    updatePlaylist as updatePlaylistCore,
    PlexSettings,
    PlaylistUpdateData,
    RetryConfig
} from '@spotify-to-plex/plex-helpers';

/**
 * Convenience wrapper for updatePlaylist
 */
export async function updatePlaylist(id: string, data: { title: string }): Promise<void> {
    const settings = await plex.getSettings();
    if (!settings.uri || !settings.token || !settings.id) {
        throw new Error('Plex settings not configured properly');
    }

    return updatePlaylistCore(settings as Required<typeof settings>, getAPIUrl, id, data);
}

/**
 * Version that accepts settings as parameter
 */
export async function updatePlaylistWithSettings(
    settings: PlexSettings,
    playlistId: string,
    data: PlaylistUpdateData,
    config?: RetryConfig
): Promise<void> {
    return updatePlaylistCore(settings, getAPIUrl, playlistId, data, config);
}