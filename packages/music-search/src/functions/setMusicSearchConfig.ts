import { MusicSearchConfig } from "../types/MusicSearchConfig";
import { setState } from "./state/setState";
import { compileFunctionStrings } from "./compileFunctionStrings";

export function setMusicSearchConfig(config: MusicSearchConfig): void {
    const runtimeFilters = compileFunctionStrings(config.matchFilters);
    setState({ 
        musicSearchConfig: config,
        runtimeFilters 
    });
}