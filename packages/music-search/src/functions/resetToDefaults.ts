import { SearchApproachConfig } from '../types/SearchApproachConfig';
import { MusicSearchConfig } from '../types/MusicSearchConfig';
import { 
    DEFAULT_MATCH_FILTERS, 
    DEFAULT_TEXT_PROCESSING, 
    DEFAULT_SEARCH_APPROACHES
} from '../config/default-config';
import { updateMatchFilters } from './updateMatchFilters';
import { updateTextProcessing } from './updateTextProcessing';
import { updateSearchApproaches } from './updateSearchApproaches';
import { getMusicSearchConfigFromStorage } from './getMusicSearchConfigFromStorage';

export async function resetToDefaults(storageDir: string): Promise<MusicSearchConfig> {
    await Promise.all([
        updateMatchFilters(storageDir, [...DEFAULT_MATCH_FILTERS]),
        updateTextProcessing(storageDir, DEFAULT_TEXT_PROCESSING),
        updateSearchApproaches(storageDir, DEFAULT_SEARCH_APPROACHES as SearchApproachConfig[])
    ]);
    
    return getMusicSearchConfigFromStorage(storageDir);
}