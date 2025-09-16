import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

function getSettingsPath(): string {
    // Try project-relative path first (for running from project root)
    const projectPath = resolve('apps/web/settings');
    if (existsSync(join(projectPath, '../..'))) {
        return projectPath;
    }

    // Fall back to local settings directory
    return resolve('settings');
}

export const settingsPath = getSettingsPath();