import { PlexSettings, PlexSettingsUpdate } from '../types';
import { setState } from './state';
import { writeAtomicJSON } from './writeAtomicJSON';
import { getSettings } from './getSettings';

export async function updateSettings(updates: PlexSettingsUpdate): Promise<PlexSettings> {
    const current = await getSettings();
    const updated = { ...current, ...updates };
    
    await writeAtomicJSON('settings.json', updated);
    
    // Update cache
    setState({ settingsCache: updated });
    
    return updated;
}