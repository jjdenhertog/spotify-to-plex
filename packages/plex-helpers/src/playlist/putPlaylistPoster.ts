import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { 
  PlexSettings, 
  RetryConfig,
  GetAPIUrlFn 
} from '../types';
import { validatePlexSettings } from '../utils/validatePlexSettings';
import { handleOneRetryAttempt } from '../retry';

/**
 * Sets poster image for a Plex playlist
 */
export async function putPlaylistPoster(
  settings: PlexSettings,
  getAPIUrl: GetAPIUrlFn,
  playlistId: string,
  posterUrl: string,
  config: RetryConfig = {}
): Promise<void> {
  validatePlexSettings(settings);

  const url = getAPIUrl(settings.uri, `/playlists/${playlistId}/posters`);
  const query = new URLSearchParams({ url: posterUrl });

  await handleOneRetryAttempt(
    () => AxiosRequest.post(`${url}?${query.toString()}`, settings.token),
    config
  );
}