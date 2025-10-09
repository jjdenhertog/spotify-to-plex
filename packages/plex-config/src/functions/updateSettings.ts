import { PlexSettings } from '../types/PlexSettings';
import { PlexSettingsUpdate } from '../types/PlexSettingsUpdate';
import { getSettings } from './getSettings';
import { writeJSON } from '../utils/fileUtils';

export async function updateSettings(updates: PlexSettingsUpdate): Promise<PlexSettings> {
    const current = await getSettings(true);
    const updated = { ...current, ...updates };

    await writeJSON('plex.json', updated);

    return updated;
}