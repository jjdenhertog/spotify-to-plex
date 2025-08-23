import { AxiosRequest } from '@spotify-to-plex/http-client';
import { GetPlaylistResponse } from '@spotify-to-plex/shared-types';
import { 
  PlexSettings, 
  PlaylistItem, 
  PlaylistUpdateData, 
  RetryConfig,
  PlexPlaylistError,
  GetAPIUrlFn 
} from './types';
import { validatePlexSettings, getPlexUri } from './utils';
import { handleOneRetryAttempt } from './retry';

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

/**
 * Creates a new Plex playlist
 */
export async function storePlaylist(
  settings: PlexSettings,
  getAPIUrl: GetAPIUrlFn,
  name: string,
  uri: string
): Promise<string> {
  validatePlexSettings(settings);

  const url = getAPIUrl(settings.uri, `/playlists`);
  const query = new URLSearchParams({
    title: name,
    type: "audio",
    smart: "0",
    uri
  });

  const result = await AxiosRequest.post<GetPlaylistResponse>(
    `${url}?${query.toString()}`, 
    settings.token
  );
  
  const id = result.data.MediaContainer.Metadata?.[0]?.ratingKey;
  
  if (!id) {
    throw new PlexPlaylistError('Failed to create playlist - no ID returned');
  }

  return id;
}

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