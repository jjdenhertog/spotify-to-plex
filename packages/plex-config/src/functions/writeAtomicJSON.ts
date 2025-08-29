import fs from 'fs-extra';
import { join } from 'node:path';
import { getState } from './state';

const { writeFile } = fs;

export async function writeAtomicJSON(fileName: string, data: unknown): Promise<void> {
    try {
        const state = getState();
        if (!state.baseDir) {
            throw new Error('Base directory not set. Call initializeState first.');
        }
        
        const filePath = join(state.baseDir, fileName);

        // Write to temporary file first for atomic operation
        const tempPath = `${filePath}.tmp`;
        await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');

        // Atomic rename
        const nodeFs = await import('node:fs');
        await nodeFs.promises.rename(tempPath, filePath);
    } catch (error) {
        throw new Error(`Failed to write ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}