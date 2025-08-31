import { PlexSettings } from '../types/PlexSettings';
import { getState } from './state';
import { initialize } from './initialize';
import { loadSettingsCache } from './loadSettingsCache';

export async function getSettings(): Promise<PlexSettings> {
    const state = getState();
    
    if (!state.initialized) {
        await initialize();
    }

    if (state.settingsCache === null) {
        await loadSettingsCache();
    }

    return state.settingsCache ?? {};
}