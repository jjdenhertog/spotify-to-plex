import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { handleOneRetryAttempt } from '../retry';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';
import { getAPIUrl } from '@spotify-to-plex/shared-utils/utils/getAPIUrl';

export async function putPlaylistPoster(id: string, image: string) {
    let posters = await getPosters(id);
    const uploadOnly = posters.size == 1;
    await uploadPoster(id, image);

    if (uploadOnly)
        return;

    posters = await getPosters(id);
    // @ts-expect-error Needs some refactoring (typing missing)
    const uploadedPoster = posters.Metadata.find(item => item.key.indexOf('upload') > -1)
    await putPoster(id, uploadedPoster.ratingKey)

}

export async function getPlaylist(id: string) {
    const settings = await getSettings();
    const { token, uri } = settings;
    if (!token || !uri)
        throw new Error('Plex settings not configured properly');

    const url = getAPIUrl(uri, `/library/metadata/${id}`);
    const currentPlaylist = await handleOneRetryAttempt(() => AxiosRequest.get<any>(url, token))

    return currentPlaylist.data.MediaContainer.Metadata[0];
}
async function getPosters(id: string) {
    const settings = await getSettings();
    const { token, uri } = settings;
    if (!token || !uri)
        throw new Error('Plex settings not configured properly');

    const url = getAPIUrl(uri, `/library/metadata/${id}/posters`);
    const currentPosters = await handleOneRetryAttempt(() => AxiosRequest.get<any>(url, token))

    return currentPosters.data.MediaContainer;
}
async function putPoster(id: string, uploadUrl: string) {
    const settings = await getSettings();
    const { token, uri } = settings;
    if (!token || !uri)
        throw new Error('Plex settings not configured properly');

    const url = getAPIUrl(uri, `/library/metadata/${id}/poster?url=${encodeURIComponent(uploadUrl)}`);

    return handleOneRetryAttempt(() => AxiosRequest.put<any>(url, token))
}

async function uploadPoster(id: string, image: string) {
    const settings = await getSettings();
    const { token, uri } = settings;
    if (!token || !uri)
        throw new Error('Plex settings not configured properly');

    const url = getAPIUrl(uri, `/library/metadata/${id}/posters?url=${encodeURIComponent(image)}`);

    return AxiosRequest.post<any>(url, token)
}