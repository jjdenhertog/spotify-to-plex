import fs from 'fs-extra';
const { ensureDir, writeFile } = fs;
import { join } from 'node:path';
import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';

const MATCH_FILTERS_FILE = 'match-filters.json';

async function writeJSON(filePath: string, data: unknown): Promise<void> {
    try {
        await ensureDir(join(filePath, '..'));
        
        // Write to temporary file first for atomic operation
        const tempPath = `${filePath}.tmp`;
        await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
        
        // Atomic rename
        const nodeFs = await import('node:fs');
        await nodeFs.promises.rename(tempPath, filePath);
    } catch (error) {
        throw new Error(`Failed to write ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function updateMatchFilters(storageDir: string, filters: MatchFilterConfig[]): Promise<MatchFilterConfig[]> {
    const filePath = join(storageDir, MATCH_FILTERS_FILE);
    await writeJSON(filePath, filters);

    return filters;
}