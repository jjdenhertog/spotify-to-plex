import { TidalTrack } from "../../types/TidalTrack";
import { operations } from "../../types/TidalAPI";
import tidalApiRequest from "../tidalApiRequest";
import { getState } from "./state";
import { authenticate } from "./authenticate";
import { getTrackByIds } from "./getTrackByIds";

export async function searchTracks(query: string, countryCode: string = 'NL'): Promise<TidalTrack[]> {
    const state = getState();
    
    // Authenticate again if the token is expired
    if (!state.expiresAt || Date.now() > state.expiresAt) {
        await authenticate();
    }

    const updatedState = getState();
    let tidalTracks: TidalTrack[] = [];

    if (updatedState.accessToken) {
        // Search for tracks
        const result = await tidalApiRequest<operations['getSearchResultsByQuery']>(
            updatedState.accessToken, 
            `https://openapi.tidal.com/v2/searchresults/${encodeURIComponent(query)}`, 
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