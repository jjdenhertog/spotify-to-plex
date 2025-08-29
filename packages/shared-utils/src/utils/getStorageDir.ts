/**
 * Get storage directory from environment or default to current working directory
 */
export const getStorageDir = (): string => {
    return process.env.SETTINGS_DIR || process.cwd();
};