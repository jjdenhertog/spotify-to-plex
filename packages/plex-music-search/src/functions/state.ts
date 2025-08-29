import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";
import { PlexTrack } from "../types/PlexTrack";

type PlexMusicSearchState = {
    config?: PlexMusicSearchConfig;
    cache: { id: string, result: PlexTrack[] }[];
}

const state: PlexMusicSearchState = {
    config: undefined,
    cache: []
};

export function getState(): PlexMusicSearchState {
    return state;
}

export function setState(newState: Partial<PlexMusicSearchState>): void {
    Object.assign(state, newState);
}


export function resetCache(): void {
    state.cache = [];
}

export function setConfig(config: PlexMusicSearchConfig): void {
    state.config = config;
}

export function getConfig(): PlexMusicSearchConfig | undefined {
    return state.config;
}

export function addToCache(id: string, result: PlexTrack[]): void {
    state.cache.push({ id, result });
}

export function getFromCache(id: string): PlexTrack[] | undefined {
    const cached = state.cache.find(item => item.id === id);

    return cached?.result;
}