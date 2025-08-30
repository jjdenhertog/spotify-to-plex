import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { GetPlaylistResponse } from '@spotify-to-plex/shared-types/plex/api';
import { 
  PlexSettings, 
  PlaylistUpdateData, 
  RetryConfig,
  GetAPIUrlFn 
} from '../types';
import { validatePlexSettings } from '../utils/validatePlexSettings';
import { handleOneRetryAttempt } from '../retry';

/**
 * Updates a Plex playlist
 */
export async function updatePlaylist(
  settings: PlexSettings,
  getAPIUrl: GetAPIUrlFn,
  playlistId: string,
  data: PlaylistUpdateData,
  config: RetryConfig = {}
): Promise<void> {
  validatePlexSettings(settings);

  const url = getAPIUrl(settings.uri, `/playlists/${playlistId}`);
  const query = new URLSearchParams(data as any);

  await handleOneRetryAttempt(
    () => AxiosRequest.put<GetPlaylistResponse>(`${url}?${query.toString()}`, settings.token),
    config
  );
}