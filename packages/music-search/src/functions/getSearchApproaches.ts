import { join } from 'node:path';
import { SearchApproachConfig } from '../types/SearchApproachConfig';
import { readJSON } from './readJSON';
import { updateSearchApproaches } from './updateSearchApproaches';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { DEFAULT_SEARCH_APPROACHES } from '../config/default-config';

const SEARCH_APPROACHES_FILE = 'search-approaches.json';

export async function getSearchApproaches(storageDir: string): Promise<SearchApproachConfig[]> {
    const filePath = join(storageDir, SEARCH_APPROACHES_FILE);
    const approaches = await readJSON<SearchApproachConfig[]>(filePath);

    if (!approaches){
        const storageDir = getStorageDir();
        updateSearchApproaches(storageDir, DEFAULT_SEARCH_APPROACHES)

        return DEFAULT_SEARCH_APPROACHES;
    }

    return approaches;
}