import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import { AxiosRequest } from '../AxiosRequest';
import { getUri } from './getUri';

export async function addItemsToPlaylist(id: string, items: { key: string; source?: string; }[]) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    const url = getAPIUrl(plex.settings.uri, `/playlists/${id}/items`);
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const uri = getUri(item.key, item.source);
        const putRequestUrl = `${url}?uri=${encodeURIComponent(uri)}`;
        try {
            await AxiosRequest.put(putRequestUrl, plex.settings.token)
        } catch (e) {
            // Wait for 1 sec. and try again
            await (new Promise((resolve) => {
                setTimeout(resolve, 1000);
            }));
            try {
                await AxiosRequest.put(putRequestUrl, plex.settings.token)
            } catch (e) { }
        }
    }

}
