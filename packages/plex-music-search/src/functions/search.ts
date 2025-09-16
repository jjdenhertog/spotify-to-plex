import { setConfig } from "@spotify-to-plex/music-search/functions/setConfig";
import { setMusicSearchConfig } from "@spotify-to-plex/music-search/functions/setMusicSearchConfig";
import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";
import { PlexMusicSearchTrack } from "../types/PlexMusicSearchTrack";
import { SearchResponse } from "../types/SearchResponse";
import { setConfig as setStateConfig, resetCache } from "./state";
import { newTrackSearch } from "./newTrackSearch";

export async function search(config: PlexMusicSearchConfig, tracks: PlexMusicSearchTrack[]): Promise<SearchResponse[]> {
    if (!config.searchApproaches || config.searchApproaches.length === 0) 
        throw new Error('No search approaches provided. Configuration must include explicit searchApproaches.');

    const approaches = config.searchApproaches;

    // Set configuration
    setStateConfig(config);
    setConfig(config);
    
    // Set music search configuration if available
    const { musicSearchConfig } = config;
    if (musicSearchConfig) 
        setMusicSearchConfig(musicSearchConfig);

    // Reset cache
    resetCache();

    const result: SearchResponse[] = [];

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track) {
            const trackResult = await newTrackSearch(approaches, track, false);
            result.push(trackResult);
        }
    }

    return result;
}