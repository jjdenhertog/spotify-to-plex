import { SearchConfig } from "@spotify-to-plex/music-search/types/SearchConfig";
import { MusicSearchConfig } from "@spotify-to-plex/music-search/types/config";
import { PlexMusicSearchApproach } from "./PlexMusicSearchApproach";


export type PlexMusicSearchConfig = SearchConfig & {
    token: string;
    uri: string;
    searchApproaches?: PlexMusicSearchApproach[];
    musicSearchConfig?: MusicSearchConfig;
};
