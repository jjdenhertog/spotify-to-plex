import { setCredentials, authenticate } from "../session/credentials";
import { TidalMusicSearchConfig } from "../types/TidalMusicSearchConfig";
import { TidalMusicSearchTrack } from "../types/TidalMusicSearchTrack";
import { SearchResponse } from "../types/SearchResponse";
import { setMusicSearchConfig, resetCache } from "../session/state";
import { newTrackSearch } from "./newTrackSearch";

export async function search(config: TidalMusicSearchConfig, tracks: TidalMusicSearchTrack[]) {
    // Setup approaches
    const { searchApproaches: approaches } = config;
    if (!approaches)
        throw new Error('No search approaches provided. Configuration must include explicit searchApproaches.');

    // Set configuration
    setMusicSearchConfig(config);
    
    // Set the Tidal credentials
    const { clientId, clientSecret } = config;
    setCredentials(clientId, clientSecret);

    // Initialize tidal search
    await authenticate();

    // Reset cache
    resetCache();

    // Search for all tracks
    const result: SearchResponse[] = [];

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track) {
            const trackResult = await newTrackSearch(approaches, track);
            result.push(trackResult);
        }
    }

    return result;
}