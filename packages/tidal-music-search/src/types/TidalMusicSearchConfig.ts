import { SearchConfig } from "@spotify-to-plex/music-search";
import { TidalMusicSearchApproach } from "./TidalMusicSearchApproach";

export type TidalMusicSearchConfig = SearchConfig & {
    clientId: string,
    clientSecret: string,
    searchApproaches?: TidalMusicSearchApproach[];
};
