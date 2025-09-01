import fs from 'fs-extra';
const { pathExists, readFile } = fs;
import { join } from 'node:path';
import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';
import { DEFAULT_MATCH_FILTERS } from '../config/default-config';

const MATCH_FILTERS_FILE = 'match-filters.json';

async function readJSON<T>(filePath: string): Promise<T | null> {
    try {
        if (!(await pathExists(filePath))) {
            return null;
        }

        const content = await readFile(filePath, 'utf8');

        return JSON.parse(content) as T;
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return null;
        }

        throw new Error(`Failed to read ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getMatchFilters(storageDir: string): Promise<readonly MatchFilterConfig[]> {
    const filePath = join(storageDir, MATCH_FILTERS_FILE);
    const filters = await readJSON<MatchFilterConfig[]>(filePath);

    return filters ?? DEFAULT_MATCH_FILTERS;
}