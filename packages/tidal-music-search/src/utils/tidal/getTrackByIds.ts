import { TidalTrack } from "../../types/TidalTrack";
import { TidalComponents, operations } from "../../types/TidalAPI";
import tidalApiRequest from "../tidalApiRequest";
import { getState } from "./state";

export async function getTrackByIds(ids: string[], countryCode: string): Promise<TidalTrack[]> {
    const state = getState();
    
    if (!state.accessToken) {
        return [];
    }

    const result: TidalTrack[] = [];
    const searchResult = await tidalApiRequest<operations['getTracksByFilters']>(
        state.accessToken, 
        `https://openapi.tidal.com/v2/tracks`, 
        {
            countryCode,
            include: ['artists', 'tracks', 'albums'],
            'filter[id]': ids
        }
    );

    const { data, included } = searchResult.data;

    if (data && included && data.length > 0 && included.length > 0) {
        for (let i = 0; i < data.length; i++) {
            const track = data[i];
            if (!track)
                continue;

            const { id, attributes, relationships } = track;
            const title = attributes?.title;
            const link = getLink(attributes?.externalLinks);
            const artists = included
                .filter(item => item.type == 'artists' && relationships?.artists?.data?.some((artist: any) => artist.id == item.id))
                .filter(item => item.type == 'artists')
                .map(item => ({
                    name: item.attributes?.name || '',
                    link: getLink(item.attributes?.externalLinks)
                }));
            const albums = included
                .filter(item => item.type == 'albums' && relationships?.albums?.data?.some((album: any) => album.id == item.id))
                .filter(item => item.type == 'albums')
                .map(item => ({
                    id: item.id,
                    title: item.attributes?.title || '',
                    link: getLink(item.attributes?.externalLinks)
                }));

            if (id && title && link && artists && albums && artists.length > 0 && albums.length > 0) {
                const [album] = albums;
                if (album) {
                    result.push({ id, title, link, artists, album });
                }
            }
        }
    }

    return result;
}

function getLink(data?: TidalComponents["schemas"]["Catalogue_Item_External_Link"][]): string {
    if (!data) {
        return '';
    }

    const link = data.find(item => item.meta.type == 'TIDAL_SHARING');
    if (link?.href) {
        return link.href;
    }

    return '';
}