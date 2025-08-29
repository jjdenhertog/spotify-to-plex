import { MusicSearchConfig, RuntimeMatchFilter } from "../../types/config";
import { SearchConfig } from "../../types/SearchConfig";

export type MusicSearchState = {
    config?: SearchConfig;
    musicSearchConfig?: MusicSearchConfig;
    runtimeFilters?: RuntimeMatchFilter[];
}