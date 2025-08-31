import { MusicSearchConfig } from "../../types/MusicSearchConfig";
import { RuntimeMatchFilter } from "../../types/RuntimeMatchFilter";
import { SearchConfig } from "../../types/SearchConfig";

export type MusicSearchState = {
    config?: SearchConfig;
    musicSearchConfig?: MusicSearchConfig;
    runtimeFilters?: RuntimeMatchFilter[];
}