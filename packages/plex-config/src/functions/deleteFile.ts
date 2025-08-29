import fs from 'fs-extra';
import { join } from 'node:path';
import { getState } from './state';

const { remove, pathExists } = fs;

export async function deleteFile(fileName: string): Promise<void> {
    try {
        const state = getState();
        if (!state.baseDir) {
            throw new Error('Base directory not set. Call initializeState first.');
        }
        
        const filePath = join(state.baseDir, fileName);

        if (await pathExists(filePath)) {
            await remove(filePath);
        }
    } catch (error) {
        throw new Error(`Failed to delete ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}