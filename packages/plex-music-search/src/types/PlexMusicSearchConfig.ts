import { SearchConfig, MusicSearchConfig } from "@spotify-to-plex/music-search";
import { PlexMusicSearchApproach } from "./PlexMusicSearchApproach";


export type PlexMusicSearchConfig = SearchConfig & {
    token: string;
    uri: string;
    searchApproaches?: PlexMusicSearchApproach[];
    musicSearchConfig?: MusicSearchConfig;
};
