import { plex } from "../../library/plex";
import { AxiosRequest } from '../AxiosRequest';
import getAPIUrl from "../getAPIUrl";
import { handleOneRetryAttempt } from "./handleOneRetryAttempt";

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
    const url = getAPIUrl(plex.settings.uri, `/library/metadata/${id}`);
    const currentPlaylist = await handleOneRetryAttempt(() => AxiosRequest.get<any>(url, plex.settings.token))

    return currentPlaylist.data.MediaContainer.Metadata[0];
}
async function getPosters(id: string) {
    const url = getAPIUrl(plex.settings.uri, `/library/metadata/${id}/posters`);
    const currentPosters = await handleOneRetryAttempt(() => AxiosRequest.get<any>(url, plex.settings.token))

    return currentPosters.data.MediaContainer;
}
async function putPoster(id: string, uploadUrl: string) {
    const url = getAPIUrl(plex.settings.uri, `/library/metadata/${id}/poster?url=${encodeURIComponent(uploadUrl)}`);

    return handleOneRetryAttempt(() => AxiosRequest.put<any>(url, plex.settings.token))
}

async function uploadPoster(id: string, image: string) {
    const url = getAPIUrl(plex.settings.uri, `/library/metadata/${id}/posters?url=${encodeURIComponent(image)}`);

    return AxiosRequest.post<any>(url, plex.settings.token)
}