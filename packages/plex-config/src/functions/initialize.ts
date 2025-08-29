import fs from 'fs-extra';
import { getState, setState } from './state';
import { loadSettingsCache } from './loadSettingsCache';
import { loadPlaylistsCache } from './loadPlaylistsCache';

const { ensureDir } = fs;

export async function initialize(): Promise<void> {
    const state = getState();
    
    if (state.initialized || !state.baseDir) {
        return;
    }

    await ensureDir(state.baseDir);

    // Preload both settings and playlists concurrently
    await Promise.all([
        loadSettingsCache(),
        loadPlaylistsCache()
    ]);

    setState({ initialized: true });
}