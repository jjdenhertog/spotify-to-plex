import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import { GetPlaylistResponse } from '@spotify-to-plex/shared-types';
// MIGRATED: Updated to use shared types package
import { AxiosRequest } from '@spotify-to-plex/http-client';
// MIGRATED: Updated to use http-client package

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
    const id = result.data.MediaContainer.Metadata?.[0]?.ratingKey;
    
    if (!id) {
        throw new Error('Failed to create playlist - no ID returned');
    }

    return id;
}
