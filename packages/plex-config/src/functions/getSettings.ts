import { PlexSettings } from '../types/PlexSettings';
import { readJSON } from '../utils/fileUtils';

export async function getSettings(raw: boolean = false) {
    const settings = await readJSON<PlexSettings>('plex.json');
    if (!settings)
        return { id: '', uri: '', token: '' };

    if (raw)
        return settings;

    return {
        ...settings,
        token: settings.serverToken || settings.token
    };
}