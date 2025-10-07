import { setConfig } from "@spotify-to-plex/music-search/functions/setConfig";
import { setCredentials, authenticate } from "../session/credentials";
import { TidalMusicSearchConfig } from "../types/TidalMusicSearchConfig";
import { TidalMusicSearchTrack } from "../types/TidalMusicSearchTrack";
import { SearchResponse } from "../types/SearchResponse";
import { setMusicSearchConfig, resetCache } from "../session/state";
import { newTrackSearch } from "./newTrackSearch";

export async function analyze(config: TidalMusicSearchConfig, track: TidalMusicSearchTrack): Promise<SearchResponse> {
    const { searchApproaches: approaches } = config;

    if (!approaches)
        throw new Error('No search approaches provided. Configuration must include explicit searchApproaches.');

    // Set configuration
    setMusicSearchConfig(config);
    setConfig(config);

    // Set the Tidal credentials
    const { clientId, clientSecret } = config;
    setCredentials(clientId, clientSecret);

    // Initialize tidal search
    await authenticate();

    // Reset cache
    resetCache();

    return newTrackSearch(approaches, track, true);
}