import { getMatchFilters } from './getMatchFilters';
import { getTextProcessing } from './getTextProcessing';
import { getSearchApproaches } from './getSearchApproaches';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';

export async function getMusicSearchConfig() {

    const storageDir = getStorageDir();
    const [matchFilters, textProcessing, searchApproaches] = await Promise.all([
        getMatchFilters(storageDir),
        getTextProcessing(storageDir),
        getSearchApproaches(storageDir)
    ]);

    if(!searchApproaches)
        throw new Error('Search approaches configuration is missing. Please configure search approaches or reset to defaults.');
    
    return {
        matchFilters,
        textProcessing,
        searchApproaches,
        options: {
            enableCaching: true,
            maxCacheSize: 1000,
            debugMode: false
        }
    };
}