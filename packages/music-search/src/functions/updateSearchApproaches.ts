import fs from 'fs-extra';
const { ensureDir, writeFile } = fs;
import { join } from 'node:path';
import { SearchApproachConfig } from '../types/SearchApproachConfig';

const SEARCH_APPROACHES_FILE = 'search-approaches.json';

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

export async function updateSearchApproaches(storageDir: string, approaches: SearchApproachConfig[]): Promise<SearchApproachConfig[]> {
    const filePath = join(storageDir, SEARCH_APPROACHES_FILE);
    await writeJSON(filePath, approaches);

    return approaches;
}