import { TidalAlbum } from "../../types/TidalAlbum";
import { operations } from "../../types/TidalAPI";
import tidalApiRequest from "../tidalApiRequest";
import { getState } from "./state";
import { authenticate } from "./authenticate";

export async function searchAlbum(query: string, countryCode: string = 'NL'): Promise<TidalAlbum[]> {
    const state = getState();
    
    // Authenticate again if the token is expired
    if (!state.expiresAt || Date.now() > state.expiresAt) {
        await authenticate();
    }

    const updatedState = getState();
    const tidalAlbums: TidalAlbum[] = [];

    if (updatedState.accessToken) {
        // Search for albums
        const result = await tidalApiRequest<operations['getSearchResultsAlbumsRelationship']>(
            updatedState.accessToken, 
            `https://openapi.tidal.com/v2/searchresults/${encodeURIComponent(query)}/relationships/albums`, 
            {
                countryCode,
                include: 'albums'
            }
        );

        // Get album title + artist
        const albums = result.data?.data;

        if (albums && albums.length > 0) {
            for (let i = 0; i < albums.length; i++) {
                const album = albums[i];
                if (!album)
                    continue;

                const { id } = album;
                const albumData = result.data.included?.find(item => item.id == id);
                if (albumData && albumData.type == 'albums' && albumData.attributes) {
                    const { title } = albumData.attributes;

                    // eslint-disable-next-line max-depth
                    if (!albumData.relationships?.artists.links?.self) {
                        continue;
                    }
                    
                    // eslint-disable-next-line max-depth

                    const artistResult = await tidalApiRequest<operations['getArtistAlbumsRelationship']>(
                        updatedState.accessToken, 
                        `https://openapi.tidal.com/v2${albumData.relationships.artists.links.self}`, 
                        { include: ['artists'] }
                    );

                    // eslint-disable-next-line max-depth
                    if (artistResult?.data.included) {
                        const artists = artistResult.data.included
                            .map(item => item.type == 'artists' ? item.attributes?.name || "" : "")
                            .filter(item => !!item);

                        tidalAlbums.push({
                            id,
                            title,
                            artists
                        });
                    }
                }
            }
        }
    }

    return tidalAlbums;
}