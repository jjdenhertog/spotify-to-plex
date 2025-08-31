import { MusicSearchConfig } from "../types/MusicSearchConfig";
import { DEFAULT_MUSIC_SEARCH_CONFIG } from "../config/default-config";
import { getState } from "./state/getState";

export function getCurrentMusicSearchConfig(): MusicSearchConfig {
    const state = getState();

    return state.musicSearchConfig ?? DEFAULT_MUSIC_SEARCH_CONFIG;
}