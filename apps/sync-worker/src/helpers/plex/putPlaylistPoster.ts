import { plex } from "../../library/plex";
import {
    putPlaylistPoster as putPlaylistPosterCore,
    PlexSettings,
    RetryConfig,
    handleOneRetryAttempt
} from '@spotify-to-plex/plex-helpers';
import { AxiosRequest } from '@spotify-to-plex/http-client';
import getAPIUrl from "../getAPIUrl";

/**
 * Legacy wrapper for putPlaylistPoster with complex poster management
 * @deprecated Use putPlaylistPosterWithSettings instead
 */
export async function putPlaylistPoster(id: string, image: string): Promise<void> {
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

/**
 * Modern version that accepts settings as parameter
 */
export async function putPlaylistPosterWithSettings(
    settings: PlexSettings,
    playlistId: string,
    posterUrl: string,
    config?: RetryConfig
): Promise<void> {
    return putPlaylistPosterCore(settings, getAPIUrl, playlistId, posterUrl, config);
}

/**
 * Get playlist metadata
 */
export async function getPlaylist(id: string) {
    const uri = plex.settings.uri;
    const token = plex.settings.token;
    if (!uri || !token) {
        throw new Error('Plex settings not configured');
    }
    const url = getAPIUrl(uri, `/library/metadata/${id}`);
    const currentPlaylist = await handleOneRetryAttempt(() => AxiosRequest.get<any>(url, token))

    return currentPlaylist.data.MediaContainer.Metadata[0];
}

/**
 * Modern version that accepts settings as parameter
 */
export async function getPlaylistWithSettings(settings: PlexSettings, id: string) {
    if (!settings.uri || !settings.token) {
        throw new Error('Plex settings not configured');
    }
    const url = getAPIUrl(settings.uri, `/library/metadata/${id}`);
    const currentPlaylist = await handleOneRetryAttempt(() => AxiosRequest.get<any>(url, settings.token))

    return currentPlaylist.data.MediaContainer.Metadata[0];
}

async function getPosters(id: string) {
    const uri = plex.settings.uri;
    const token = plex.settings.token;
    if (!uri || !token) {
        throw new Error('Plex settings not configured');
    }
    const url = getAPIUrl(uri, `/library/metadata/${id}/posters`);
    const currentPosters = await handleOneRetryAttempt(() => AxiosRequest.get<any>(url, token))

    return currentPosters.data.MediaContainer;
}

async function putPoster(id: string, uploadUrl: string) {
    const uri = plex.settings.uri;
    const token = plex.settings.token;
    if (!uri || !token) {
        throw new Error('Plex settings not configured');
    }
    const url = getAPIUrl(uri, `/library/metadata/${id}/poster?url=${encodeURIComponent(uploadUrl)}`);

    return handleOneRetryAttempt(() => AxiosRequest.put<any>(url, token))
}

async function uploadPoster(id: string, image: string) {
    const uri = plex.settings.uri;
    const token = plex.settings.token;
    if (!uri || !token) {
        throw new Error('Plex settings not configured');
    }
    const url = getAPIUrl(uri, `/library/metadata/${id}/posters?url=${encodeURIComponent(image)}`);

    return AxiosRequest.post<any>(url, token)
}