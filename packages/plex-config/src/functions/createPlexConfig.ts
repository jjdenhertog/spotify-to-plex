import { initializeState } from './state';
import { loadSettingsCache } from './loadSettingsCache';
import { loadPlaylistsCache } from './loadPlaylistsCache';
import { PlexConfigOptions } from '../types/PlexConfigOptions';

export async function createPlexConfig(options: PlexConfigOptions): Promise<void> {
    initializeState(options);
    
    if (options.preloadCache !== false) {
        await loadSettingsCache();
        await loadPlaylistsCache();
    }
}