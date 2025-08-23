import getAPIUrl from '../getAPIUrl';
import { plex } from '../../library/plex';
import { AxiosRequest } from '@spotify-to-plex/http-client';

export async function removeItemsFromPlaylist(id: string) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    const url = getAPIUrl(plex.settings.uri, `/playlists/${id}/items`);
    await AxiosRequest.delete(url, plex.settings.token)

}