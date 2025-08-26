import { SearchConfig, MusicSearchConfig } from "@spotify-to-plex/music-search";
import { TidalMusicSearchApproach } from "./TidalMusicSearchApproach";

export type TidalMusicSearchConfig = SearchConfig & {
    clientId: string,
    clientSecret: string,
    searchApproaches?: TidalMusicSearchApproach[];
    musicSearchConfig?: MusicSearchConfig;
};
