import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";
import { PlexMusicSearchTrack } from "../types/PlexMusicSearchTrack";
import { SearchResponse } from "../types/SearchResponse";
import { newTrackSearch } from "./newTrackSearch";
import { setMusicSearchConfig, resetCache } from "../session/state";

export async function search(config: PlexMusicSearchConfig, tracks: PlexMusicSearchTrack[]) {
    if (!config.searchApproaches || config.searchApproaches.length === 0) 
        throw new Error('No search approaches provided. Configuration must include explicit searchApproaches.');

    const approaches = config.searchApproaches;

    // Set configuration
    setMusicSearchConfig(config);

    // Reset cache
    resetCache();

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