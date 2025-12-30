import type { SlskdMusicSearchConfig } from "../types/SlskdMusicSearchConfig";
import type { SlskdMusicSearchTrack } from "../types/SlskdMusicSearchTrack";
import type { SearchResponse } from '../types/SearchResponse';
import { setState, setMusicSearchConfig, resetCache } from '../session/state';
import { testConnection } from '../actions/api';
import { newTrackSearch } from './newTrackSearch';
import { clearSearchCache } from '../utils/searchForTrack';

export async function analyze(config: SlskdMusicSearchConfig, tracks: SlskdMusicSearchTrack[]) {

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
    clearSearchCache();

    const result: SearchResponse[] = [];

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track) {
            const trackResult = await newTrackSearch(approaches, track, true);

            console.log(`[analyze] Track "${track.title}" by "${track.artists.join(', ')}":`, {
                queriesCount: trackResult.queries?.length || 0,
                resultsCount: trackResult.result?.length || 0,
                queries: trackResult.queries?.map(q => `${q.approach}: "${q.artist} ${q.title}"`)
            });

            result.push(trackResult);
        }
    }

    return result;
}
