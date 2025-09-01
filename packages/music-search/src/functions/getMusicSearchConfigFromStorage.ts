import { MusicSearchConfig } from '../types/MusicSearchConfig';
import { getMatchFilters } from './getMatchFilters';
import { getTextProcessing } from './getTextProcessing';
import { getSearchApproaches } from './getSearchApproaches';

export async function getMusicSearchConfigFromStorage(storageDir: string): Promise<MusicSearchConfig> {
    const [matchFilters, textProcessing, searchApproaches] = await Promise.all([
        getMatchFilters(storageDir),
        getTextProcessing(storageDir),
        getSearchApproaches(storageDir)
    ]);

    // Create legacy platform-specific structure for backward compatibility
    const platformApproaches = {
        plex: searchApproaches.filter(a => ['normal', 'filtered', 'trimmed', 'filtered_trimmed'].includes(a.id)),
        tidal: searchApproaches.filter(a => ['normal', 'filtered', 'trimmed', 'filtered_trimmed'].includes(a.id))
    };

    return {
        matchFilters,
        textProcessing,
        searchApproaches: platformApproaches,
        options: {
            enableCaching: true,
            maxCacheSize: 1000,
            debugMode: false
        }
    };
}