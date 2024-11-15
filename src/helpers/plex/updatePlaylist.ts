import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import { GetPlaylistResponse } from '@/types/PlexAPI';
import { AxiosRequest } from '../AxiosRequest';
import { handleOneRetryAttempt } from './handleOneRetryAttempt';

export async function updatePlaylist(id: string, data: { title: string }) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    const url = getAPIUrl(plex.settings.uri, `/playlists/${id}`);

    const query = new URLSearchParams(data);

    await handleOneRetryAttempt(() => AxiosRequest.put<GetPlaylistResponse>(`${url}?${query.toString()}`, plex.settings.token))
}
