import type { SlskdCredentials } from "../types/SlskdCredentials";
import type { SlskdMusicSearchConfig } from "../types/SlskdMusicSearchConfig";
import type { SlskdTrack } from "../types/SlskdTrack";
import { setMusicSearchConfig as setGlobalMusicSearchConfig } from '@spotify-to-plex/music-search/functions/setMusicSearchConfig';

type SlskdMusicSearchState = {
    credentials?: SlskdCredentials;
    config?: SlskdMusicSearchConfig;
    cache: { id: string; result: SlskdTrack[] }[];
}

const state: SlskdMusicSearchState = {
    credentials: undefined,
    config: undefined,
    cache: []
};

export function getState(): SlskdMusicSearchState {
    return state;
}

export function setState(credentials: SlskdCredentials, config: SlskdMusicSearchConfig) {
    state.credentials = credentials;
    state.config = config;
}

export function getConfig(): SlskdMusicSearchConfig | undefined {
    return state.config;
}

export function setMusicSearchConfig(config: SlskdMusicSearchConfig) {
    state.config = config;

    // Propagate match filters to music-search package
    const { musicSearchConfig } = config;
    if (musicSearchConfig) {
        setGlobalMusicSearchConfig(musicSearchConfig);
    }
}

export function addToCache(id: string, result: SlskdTrack[]) {
    state.cache.push({ id, result });
}

export function getFromCache(id: string) {
    const cached = state.cache.find(item => item.id === id);

    return cached?.result;
}

export function resetCache() {
    state.cache = [];
}

export function clearState() {
    state.credentials = undefined;
    state.config = undefined;
    state.cache = [];
}
