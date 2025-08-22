import getAPIUrl from '../getAPIUrl';
import { plex } from '../../library/plex';
import { GetPlaylistResponse } from '../../types/PlexAPI';
import { AxiosRequest } from '../AxiosRequest';

export async function storePlaylist(name: string, uri: string) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    const url = getAPIUrl(plex.settings.uri, `/playlists`);
    const query = new URLSearchParams({
        title: name,
        type: "audio",
        smart: "0",
        uri
    });

    const result = await AxiosRequest.post<GetPlaylistResponse>(`${url}?${query.toString()}`, plex.settings.token)
    const metadata = result.data.MediaContainer.Metadata?.[0];
    if (!metadata) {
        throw new Error('Failed to create playlist - no metadata returned');
    }
    const id = metadata.ratingKey;

    return id;
}