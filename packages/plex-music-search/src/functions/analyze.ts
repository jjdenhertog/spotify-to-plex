import { setConfig } from "@spotify-to-plex/music-search/functions/setConfig";
import { setMusicSearchConfig } from "@spotify-to-plex/music-search/functions/setMusicSearchConfig";
import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";
import { PlexMusicSearchTrack } from "../types/PlexMusicSearchTrack";
import { SearchResponse } from "../types/SearchResponse";
import { setConfig as setStateConfig, resetCache } from "./state";
import { newTrackSearch } from "./newTrackSearch";

export async function analyze(config: PlexMusicSearchConfig, track: PlexMusicSearchTrack): Promise<SearchResponse> {
    const {
        searchApproaches: approaches = [
            { id: 'normal', filtered: false, trim: false },
            { id: 'filtered', filtered: true, trim: false, removeQuotes: true },
            { id: 'trimmed', filtered: false, trim: true },
            { id: 'filtered_trimmed', filtered: true, trim: true, removeQuotes: true }
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

    // Reset cache
    resetCache();

    return newTrackSearch(approaches, track, true);
}