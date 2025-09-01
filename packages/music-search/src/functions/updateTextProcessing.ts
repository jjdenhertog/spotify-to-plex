import fs from 'fs-extra';
const { ensureDir, writeFile } = fs;
import { join } from 'node:path';
import { TextProcessingConfig } from '../types/TextProcessingConfig';

const TEXT_PROCESSING_FILE = 'text-processing.json';

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

export async function updateTextProcessing(storageDir: string, config: TextProcessingConfig): Promise<TextProcessingConfig> {
    const filePath = join(storageDir, TEXT_PROCESSING_FILE);
    await writeJSON(filePath, config);

    return config;
}