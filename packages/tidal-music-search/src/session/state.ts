import { TidalMusicSearchConfig } from "../types/TidalMusicSearchConfig";
import { TidalTrack } from "../types/TidalTrack";
import { setMusicSearchConfig as setGlobalMusicSearchConfig } from "@spotify-to-plex/music-search/functions/setMusicSearchConfig";
import { setConfig as setGlobalConfig } from "@spotify-to-plex/music-search/functions/setConfig";

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

export function setMusicSearchConfig(config: TidalMusicSearchConfig): void {
    state.config = config;

    setGlobalConfig(config);

    const { musicSearchConfig } = config;
    if (musicSearchConfig)
        setGlobalMusicSearchConfig(musicSearchConfig);
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