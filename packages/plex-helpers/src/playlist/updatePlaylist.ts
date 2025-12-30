import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { GetPlaylistResponse } from '@spotify-to-plex/shared-types/plex/GetPlaylistResponse';
import { PlexSettings } from '../PlexSettings';
import { PlaylistUpdateData } from '../PlaylistUpdateData';
import { RetryConfig } from '../RetryConfig';
import { validatePlexSettings } from '../utils/validatePlexSettings';
import { handleOneRetryAttempt } from '../retry';
import { getAPIUrl } from '@spotify-to-plex/shared-utils/utils/getAPIUrl';

/**
 * Updates a Plex playlist
 */
export async function updatePlaylist(settings: PlexSettings, playlistId: string, data: PlaylistUpdateData, config: RetryConfig = {}) {
    validatePlexSettings(settings);

    const url = getAPIUrl(settings.uri, `/playlists/${playlistId}`);
    const query = new URLSearchParams(data as any);

    await handleOneRetryAttempt(
        () => AxiosRequest.put<GetPlaylistResponse>(`${url}?${query.toString()}`, settings.token),
        config
    );
}