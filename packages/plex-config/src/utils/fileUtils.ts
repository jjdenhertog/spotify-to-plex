/* eslint-disable custom/no-export-only-files */
import { readFile, writeFile, pathExists, remove } from 'fs-extra';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';

import { join } from 'node:path';

export async function readJSON<T>(fileName: string): Promise<T | null> {
    try {

        const settingsPath = getStorageDir();
        const filePath = join(settingsPath, fileName);

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

export async function writeJSON(fileName: string, data: unknown): Promise<void> {
    try {

        const settingsPath = getStorageDir();
        const filePath = join(settingsPath, fileName);

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

export async function deleteJSON(fileName: string): Promise<void> {
    try {

        const settingsPath = getStorageDir();
        const filePath = join(settingsPath, fileName);

        if (await pathExists(filePath)) {
            await remove(filePath);
        }
    } catch (error) {
        throw new Error(`Failed to delete ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}