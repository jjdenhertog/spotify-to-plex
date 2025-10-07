import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { PlexSettings } from '../PlexSettings';
import { PlaylistItem } from '../PlaylistItem';
import { RetryConfig } from '../RetryConfig';
import { validatePlexSettings } from '../utils/validatePlexSettings';
import { getPlexUri } from '../utils/getPlexUri';
import { getAPIUrl } from '@spotify-to-plex/shared-utils/utils/getAPIUrl';

/**
 * Adds items to a Plex playlist
 */
export async function addItemsToPlaylist(settings: PlexSettings, playlistId: string, items: PlaylistItem[], config: RetryConfig = {}): Promise<void> {
    validatePlexSettings(settings);

    const url = getAPIUrl(settings.uri, `/playlists/${playlistId}/items`);
    const { retryDelay = 2000 } = config;

    for (const item of items) {
        if (!item?.key)
            continue;

        const uri = getPlexUri(settings, item.key, item.source);
        const putRequestUrl = `${url}?uri=${encodeURIComponent(uri)}`;

        try {
            await AxiosRequest.put(putRequestUrl, settings.token);
        } catch (_error) {
            // Single retry with delay
            await new Promise(resolve => { setTimeout(resolve, retryDelay) });
            try {
                await AxiosRequest.put(putRequestUrl, settings.token);
            } catch (_retryError) {
                // Silently continue on failure for now (matches legacy behavior)
            }
        }
    }
}