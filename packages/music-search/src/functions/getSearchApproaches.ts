import fs from 'fs-extra';
const { pathExists, readFile } = fs;
import { join } from 'node:path';
import { SearchApproachConfig } from '../types/SearchApproachConfig';
import { DEFAULT_SEARCH_APPROACHES } from '../config/default-config';

const SEARCH_APPROACHES_FILE = 'search-approaches.json';

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

export async function getSearchApproaches(storageDir: string): Promise<readonly SearchApproachConfig[]> {
    const filePath = join(storageDir, SEARCH_APPROACHES_FILE);
    const approaches = await readJSON<SearchApproachConfig[]>(filePath);

    return approaches ?? DEFAULT_SEARCH_APPROACHES;
}