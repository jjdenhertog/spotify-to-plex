import getAPIUrl from '../getAPIUrl';
import { plex } from '../../library/plex';
import {
    updatePlaylist as updatePlaylistCore,
    PlexSettings,
    PlaylistUpdateData,
    RetryConfig
} from '@spotify-to-plex/plex-helpers';

/**
 * Legacy wrapper for updatePlaylist - maintains backward compatibility
 * @deprecated Use updatePlaylistWithSettings instead
 */
export async function updatePlaylist(id: string, data: { title: string }): Promise<void> {
    return updatePlaylistCore(plex.settings, getAPIUrl, id, data);
}

/**
 * Modern version that accepts settings as parameter
 */
export async function updatePlaylistWithSettings(
    settings: PlexSettings,
    playlistId: string,
    data: PlaylistUpdateData,
    config?: RetryConfig
): Promise<void> {
    return updatePlaylistCore(settings, getAPIUrl, playlistId, data, config);
}