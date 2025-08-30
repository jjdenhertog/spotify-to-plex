import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { 
  PlexSettings, 
  PlaylistItem, 
  RetryConfig,
  GetAPIUrlFn 
} from '../types';
import { validatePlexSettings } from '../utils/validatePlexSettings';
import { getPlexUri } from '../utils/getPlexUri';
import { handleOneRetryAttempt } from '../retry';

/**
 * Removes items from a Plex playlist
 */
export async function removeItemsFromPlaylist(
  settings: PlexSettings,
  getAPIUrl: GetAPIUrlFn,
  playlistId: string,
  items: PlaylistItem[],
  config: RetryConfig = {}
): Promise<void> {
  validatePlexSettings(settings);
  
  const url = getAPIUrl(settings.uri, `/playlists/${playlistId}/items`);

  for (const item of items) {
    if (!item?.key) continue;

    const uri = getPlexUri(settings, item.key, item.source);
    const deleteRequestUrl = `${url}?uri=${encodeURIComponent(uri)}`;
    
    await handleOneRetryAttempt(
      () => AxiosRequest.delete(deleteRequestUrl, settings.token),
      config
    );
  }
}