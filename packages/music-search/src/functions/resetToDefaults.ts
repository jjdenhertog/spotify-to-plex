import { MusicSearchConfig } from '../types/MusicSearchConfig';
import {
    DEFAULT_MATCH_FILTERS,
    DEFAULT_TEXT_PROCESSING,
    DEFAULT_SEARCH_APPROACHES
} from '../config/default-config';
import { updateMatchFilters } from './updateMatchFilters';
import { updateTextProcessing } from './updateTextProcessing';
import { updateSearchApproaches } from './updateSearchApproaches';
import { getMusicSearchConfig } from './getMusicSearchConfig';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';

export async function resetToDefaults(): Promise<MusicSearchConfig> {

    const storageDir = getStorageDir();
    await Promise.all([
        updateMatchFilters(storageDir, [...DEFAULT_MATCH_FILTERS]),
        updateTextProcessing(storageDir, DEFAULT_TEXT_PROCESSING),
        updateSearchApproaches(storageDir, DEFAULT_SEARCH_APPROACHES)
    ]);

    return getMusicSearchConfig();
}