import fs from 'fs-extra';
import { join } from 'node:path';
import { getState } from './state';

const { readFile, pathExists } = fs;

export async function readJSON<T>(fileName: string): Promise<T | null> {
    try {
        const state = getState();
        if (!state.baseDir) {
            throw new Error('Base directory not set. Call initializeState first.');
        }
        
        const filePath = join(state.baseDir, fileName);

        if (!(await pathExists(filePath))) {
            return null;
        }

        const content = await readFile(filePath, 'utf8');

        return JSON.parse(content) as T;
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return null;
        }

        throw new Error(`Failed to read ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}