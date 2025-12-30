import type { SlskdMusicSearchConfig } from "../types/SlskdMusicSearchConfig";
import type { SlskdMusicSearchTrack } from "../types/SlskdMusicSearchTrack";
import type { SearchResponse } from '../types/SearchResponse';
import { setState, setMusicSearchConfig, resetCache } from '../session/state';
import { testConnection } from '../actions/api';
import { newTrackSearch } from './newTrackSearch';

export async function search(config: SlskdMusicSearchConfig, tracks: SlskdMusicSearchTrack[]) {
    const { searchApproaches: approaches } = config;
    if (!approaches)
        throw new Error('No search approaches provided. Configuration must include explicit searchApproaches.');

    setMusicSearchConfig(config);

    const { baseUrl, apiKey } = config;
    setState({ baseUrl, apiKey }, config);

    const isConnected = await testConnection({ baseUrl, apiKey });
    if (!isConnected) 
        throw new Error('Failed to connect to SLSKD API. Please check your credentials.');

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
