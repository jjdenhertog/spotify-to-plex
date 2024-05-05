import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import { GetPlaylistResponse } from '@/types/PlexAPI';
import { AxiosRequest } from '../AxiosRequest';

export async function storePlaylist(name: string, uri: string) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    let url = getAPIUrl(plex.settings.uri, `/playlists`);
    const query = new URLSearchParams({
        title: name,
        type: "audio",
        smart: "0",
        uri: uri
    });
    const result = await AxiosRequest.post<GetPlaylistResponse>(url + "?" + query.toString(), plex.settings.token)
    const id = result.data.MediaContainer.Metadata[0].ratingKey;
    return id;
}
