import { TidalMusicSearchConfig } from "../types/TidalMusicSearchConfig";
import { TidalTrack } from "../types/TidalTrack";

type TidalMusicSearchState = {
    config?: TidalMusicSearchConfig;
    cache: { id: string, result: TidalTrack[] }[];
}

const state: TidalMusicSearchState = {
    config: undefined,
    cache: []
};

export function getState(): TidalMusicSearchState {
    return state;
}

export function setState(newState: Partial<TidalMusicSearchState>): void {
    Object.assign(state, newState);
}


export function resetCache(): void {
    state.cache = [];
}

export function setConfig(config: TidalMusicSearchConfig): void {
    state.config = config;
}

export function getConfig(): TidalMusicSearchConfig | undefined {
    return state.config;
}

export function addToCache(id: string, result: TidalTrack[]): void {
    state.cache.push({ id, result });
}

export function getFromCache(id: string): TidalTrack[] | undefined {
    const cached = state.cache.find(item => item.id === id);

    return cached?.result;
}