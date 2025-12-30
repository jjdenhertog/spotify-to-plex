import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { PlexSettings } from '../PlexSettings';
import { PlaylistItem } from '../PlaylistItem';
import { RetryConfig } from '../RetryConfig';
import { validatePlexSettings } from '../utils/validatePlexSettings';
import { getPlexUri } from '../utils/getPlexUri';
import { handleOneRetryAttempt } from '../retry';
import { getAPIUrl } from '@spotify-to-plex/shared-utils/utils/getAPIUrl';

/**
 * Removes items from a Plex playlist
 */
export async function removeItemsFromPlaylist(
    settings: PlexSettings,
    playlistId: string,
    items: PlaylistItem[],
    config: RetryConfig = {}
) {
    validatePlexSettings(settings);
  
    const url = getAPIUrl(settings.uri, `/playlists/${playlistId}/items`);

    if(items.length === 0){
        await handleOneRetryAttempt(
            () => AxiosRequest.delete(url, settings.token),
            config
        );

        return;
    }

    for (const item of items) {
        if (!item?.key)
            continue;

        const uri = getPlexUri(settings, item.key, item.source);
        const deleteRequestUrl = `${url}?uri=${encodeURIComponent(uri)}`;
    
        await handleOneRetryAttempt(
            () => AxiosRequest.delete(deleteRequestUrl, settings.token),
            config
        );
    }
}