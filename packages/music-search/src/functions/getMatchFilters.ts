import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { join } from 'node:path';
import { DEFAULT_MATCH_FILTERS } from '../config/default-config';
import { readJSON } from './readJSON';
import { updateMatchFilters } from './updateMatchFilters';

const MATCH_FILTERS_FILE = 'match-filters.json';

export async function getMatchFilters(storageDir: string): Promise<MatchFilterConfig[]> {
    const filePath = join(storageDir, MATCH_FILTERS_FILE);
    const filters = await readJSON<MatchFilterConfig[]>(filePath);

    if (!filters) {
        const storageDir = getStorageDir();
        updateMatchFilters(storageDir, DEFAULT_MATCH_FILTERS);

        return DEFAULT_MATCH_FILTERS;
    }

    return filters;
}