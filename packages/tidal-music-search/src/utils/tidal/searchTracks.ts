import { TidalTrack } from "../../types/TidalTrack";
import { operations } from "../../types/TidalAPI";
import tidalApiRequest from "../tidalApiRequest";
import { getCredentials, authenticate } from "../../session/credentials";
import { getTrackByIds } from "./getTrackByIds";

export async function searchTracks(query: string, countryCode: string = 'NL'): Promise<TidalTrack[]> {
    const state = getCredentials();

    // Authenticate again if the token is expired
    if (!state.expiresAt || Date.now() > state.expiresAt)
        await authenticate();

    const updatedState = getCredentials();
    let tidalTracks: TidalTrack[] = [];

    // Fix forbidden characters
    const forbiddenCharacters = ['(', ')', '/', "...", "..", '"']

    for (let i = 0; i < forbiddenCharacters.length; i++) {
        const element = forbiddenCharacters[i];
        if (element)
            query = query.split(element).join('')
    }

    if (updatedState.accessToken) {
        // Search for tracks
        const url = `https://openapi.tidal.com/v2/searchResults/${encodeURIComponent(query)}`;
        const result = await tidalApiRequest<operations['getSearchResultsByQuery']>(
            updatedState.accessToken,
            url,
            {
                countryCode,
                include: 'tracks'
            }
        );

        // Get all track data
        const tracks = result.data?.data?.relationships?.tracks?.data;

        if (tracks && tracks.length > 0) {
            const ids = tracks.map(item => item.id);
            const trackData = await getTrackByIds(ids, countryCode);
            tidalTracks = tidalTracks.concat(trackData);
        }
    }

    return tidalTracks;
}