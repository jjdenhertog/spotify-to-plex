import { operations } from "../../types/TidalAPI";
import tidalApiRequest from "../tidalApiRequest";
import { getCredentials, authenticate } from "../../session/credentials";

export async function getAlbumTracksIds(id: string, countryCode: string = 'NL') {
    const state = getCredentials();

    // Authenticate again if the token is expired
    if (!state.expiresAt || Date.now() > state.expiresAt) {
        await authenticate();
    }

    const updatedState = getCredentials();
    const albumTrackIds: string[] = [];

    if (updatedState.accessToken) {
        // Search for tracks
        const result = await tidalApiRequest<operations['getAlbumItemsRelationship']>(
            updatedState.accessToken,
            `https://openapi.tidal.com/v2/albums/${id}/relationships/items`,
            {
                countryCode,
                include: 'items'
            }
        );

        if (result.data.data && result.data.data.length > 0) {
            return result.data.data.map(item => item.id);
        }
    }

    return albumTrackIds;
}