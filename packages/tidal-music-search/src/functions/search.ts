import { setConfig } from "@spotify-to-plex/music-search/functions/setConfig";
import { setMusicSearchConfig } from "@spotify-to-plex/music-search/functions/setMusicSearchConfig";
import { setCredentials } from "../utils/tidal/setCredentials";
import { authenticate } from "../utils/tidal/authenticate";
import { TidalMusicSearchConfig } from "../types/TidalMusicSearchConfig";
import { TidalMusicSearchTrack } from "../types/TidalMusicSearchTrack";
import { setConfig as setStateConfig, resetCache } from "./state";
import { newTrackSearch } from "./newTrackSearch";

export type SearchResponse = {
    id: string;
    artist: string;
    title: string;
    album: string;
    result: any[];
};

export async function search(config: TidalMusicSearchConfig, tracks: TidalMusicSearchTrack[]): Promise<SearchResponse[]> {
    // Setup approaches
    const {
        searchApproaches: approaches = [
            { id: 'normal', filtered: false, trim: false },
            { id: 'filtered', filtered: true, trim: false },
            { id: 'trimmed', filtered: false, trim: true },
            { id: 'filtered_trimmed', filtered: true, trim: true }
        ]
    } = config;

    // Set configuration
    setStateConfig(config);
    setConfig(config);
    
    // Set music search configuration if available
    const { musicSearchConfig } = config;
    if (musicSearchConfig) {
        setMusicSearchConfig(musicSearchConfig);
    }

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