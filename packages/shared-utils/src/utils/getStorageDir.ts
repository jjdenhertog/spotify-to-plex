import { dirname, join } from 'node:path';
import { ensureDirSync } from 'fs-extra';
import { fileURLToPath } from 'node:url';
/**
 * Get storage directory from environment or default to settings folder
 */
export const getStorageDir = (): string => {

    const dir = process.env.SETTINGS_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'settings');
    ensureDirSync(dir)

    return dir;
};