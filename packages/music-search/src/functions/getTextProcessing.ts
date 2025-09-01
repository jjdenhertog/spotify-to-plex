import fs from 'fs-extra';
const { pathExists, readFile } = fs;
import { join } from 'node:path';
import { TextProcessingConfig } from '../types/TextProcessingConfig';
import { DEFAULT_TEXT_PROCESSING } from '../config/default-config';

const TEXT_PROCESSING_FILE = 'text-processing.json';

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

export async function getTextProcessing(storageDir: string): Promise<TextProcessingConfig> {
    const filePath = join(storageDir, TEXT_PROCESSING_FILE);
    const config = await readJSON<TextProcessingConfig>(filePath);

    return config ?? DEFAULT_TEXT_PROCESSING;
}