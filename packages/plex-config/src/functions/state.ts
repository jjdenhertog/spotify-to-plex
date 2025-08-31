import { PlexConfigOptions } from '../types/PlexConfigOptions';
import { PlexSettings } from '../types/PlexSettings';
import { PlexPlaylists } from '../types/PlexPlaylists';

type PlexConfigState = {
    baseDir?: string;
    settingsCache: PlexSettings | null;
    playlistsCache: PlexPlaylists | null;
    initialized: boolean;
}

const state: PlexConfigState = {
    baseDir: undefined,
    settingsCache: null,
    playlistsCache: null,
    initialized: false
};

export function getState(): PlexConfigState {
    return state;
}

export function setState(newState: Partial<PlexConfigState>): void {
    Object.assign(state, newState);
}

export function resetState(): void {
    state.baseDir = undefined;
    state.settingsCache = null;
    state.playlistsCache = null;
    state.initialized = false;
}

export function initializeState(options: PlexConfigOptions): void {
    state.baseDir = options.storageDir;
    state.initialized = false;
}