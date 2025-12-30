import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";
import { PlexMusicSearchTrack } from "../types/PlexMusicSearchTrack";
import { newTrackSearch } from "./newTrackSearch";
import { resetCache, setMusicSearchConfig } from "../session/state";

export async function analyze(config: PlexMusicSearchConfig, track: PlexMusicSearchTrack) {
    const { searchApproaches: approaches } = config;

    if (!approaches)
        throw new Error('No search approaches provided. Configuration must include explicit searchApproaches.');

    // Set configuration
    setMusicSearchConfig(config);

    // Reset cache
    resetCache();

    return newTrackSearch(approaches, track, true);
}