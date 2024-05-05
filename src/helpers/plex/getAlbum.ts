import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import { AxiosRequest } from '../AxiosRequest';

export async function getAlbum(key: string) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    const url = getAPIUrl(plex.settings.uri, key);
    let result: any;
    try {
        result = await AxiosRequest.get(url, plex.settings.token)
    } catch (e) {
        // Cooldown
        await (new Promise(resolve => setTimeout(resolve, 1000)))
        result = await AxiosRequest.get(url, plex.settings.token)
    }

    if (result && result.data) {
        const { MediaContainer } = result.data;
        if(MediaContainer && MediaContainer.size > 0)
            return MediaContainer.Metadata;
    }
    return []
}
