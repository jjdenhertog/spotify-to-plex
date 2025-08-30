import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { 
  PlexSettings, 
  PlaylistItem, 
  RetryConfig,
  GetAPIUrlFn 
} from '../types';
import { validatePlexSettings } from '../utils/validatePlexSettings';
import { getPlexUri } from '../utils/getPlexUri';

/**
 * Adds items to a Plex playlist
 */
export async function addItemsToPlaylist(
  settings: PlexSettings,
  getAPIUrl: GetAPIUrlFn,
  playlistId: string,
  items: PlaylistItem[],
  config: RetryConfig = {}
): Promise<void> {
  validatePlexSettings(settings);
  
  const url = getAPIUrl(settings.uri, `/playlists/${playlistId}/items`);
  const { retryDelay = 2000 } = config;

  for (const item of items) {
    if (!item?.key) continue;

    const uri = getPlexUri(settings, item.key, item.source);
    const putRequestUrl = `${url}?uri=${encodeURIComponent(uri)}`;
    
    try {
      await AxiosRequest.put(putRequestUrl, settings.token);
    } catch (error) {
      // Single retry with delay
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      try {
        await AxiosRequest.put(putRequestUrl, settings.token);
      } catch (retryError) {
        // Silently continue on failure for now (matches legacy behavior)
      }
    }
  }
}