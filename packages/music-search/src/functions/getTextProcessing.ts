import { join } from 'node:path';
import { TextProcessingConfig } from '../types/TextProcessingConfig';
import { readJSON } from './readJSON';
import { updateTextProcessing } from './updateTextProcessing';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { DEFAULT_TEXT_PROCESSING } from '../config/default-config';

const TEXT_PROCESSING_FILE = 'text-processing.json';

export async function getTextProcessing(storageDir: string) {
    const filePath = join(storageDir, TEXT_PROCESSING_FILE);
    const config = await readJSON<TextProcessingConfig>(filePath);

    if (!config) {

        const storageDir = getStorageDir();
        updateTextProcessing(storageDir, DEFAULT_TEXT_PROCESSING)

        return DEFAULT_TEXT_PROCESSING;
    }

    return config;
}