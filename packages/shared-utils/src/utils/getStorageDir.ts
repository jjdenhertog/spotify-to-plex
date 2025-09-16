import { join } from 'node:path';

/**
 * Get storage directory from environment or default to settings folder
 */
export const getStorageDir = (): string => {
    if (process.env.SETTINGS_DIR) 
        return process.env.SETTINGS_DIR;

    // Default to apps/web/settings directory
    return join(process.cwd(), 'apps', 'web', 'settings');
};