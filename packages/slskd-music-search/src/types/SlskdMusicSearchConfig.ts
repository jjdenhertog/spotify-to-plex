import type { MusicSearchConfig } from "@spotify-to-plex/music-search/types/MusicSearchConfig";
import type { TextProcessingConfig } from "@spotify-to-plex/music-search/types/TextProcessingConfig";
import type { SlskdMusicSearchApproach } from "./SlskdMusicSearchApproach";

/**
 * Complete SLSKD music search configuration (mirrors TidalMusicSearchConfig)
 */

export type SlskdMusicSearchConfig = {
    baseUrl: string;
    apiKey: string;
    searchApproaches: SlskdMusicSearchApproach[];
    textProcessing: TextProcessingConfig;
    musicSearchConfig?: MusicSearchConfig;
    maxResultsPerApproach?: number;
    searchTimeout?: number;
    /** Allowed file extensions (e.g., ['flac', 'mp3']). If set, only files with these extensions will be returned. */
    allowedExtensions?: string[];
};
