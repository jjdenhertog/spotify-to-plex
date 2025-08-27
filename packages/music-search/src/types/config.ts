/**
 * Simplified music search configuration types
 * Uses function strings for runtime evaluation instead of complex compilation
 */

import { TrackWithMatching } from './TrackWithMatching';

// Simple match filter configuration with function strings
export type MatchFilterConfig = {
  readonly reason: string;
  readonly filter: string; // Function string like "(item) => item.matching.artist.match && item.matching.title.match"
}

// Text processing configuration - simple structure
export type TextProcessingConfig = {
  readonly filterOutWords: readonly string[];
  readonly filterOutQuotes: readonly string[];
  readonly cutOffSeparators: readonly string[];
  readonly processing: {
    readonly filtered: boolean;
    readonly cutOffSeperators: boolean; // Preserves typo from original code
    readonly removeQuotes: boolean;
  };
}

// Search approach configuration - simple flags
export type SearchApproachConfig = {
  readonly id: string;
  readonly filtered?: boolean;
  readonly trim?: boolean;
  readonly ignoreQuotes?: boolean;
  readonly removeQuotes?: boolean; // Plex-specific flag
  readonly force?: boolean; // Plex-specific flag
}

// Platform-specific search approaches
export type PlatformSearchConfig = {
  readonly plex: readonly SearchApproachConfig[];
  readonly tidal: readonly SearchApproachConfig[];
}

// Complete music search configuration - simplified
export type MusicSearchConfig = {
  readonly matchFilters: readonly MatchFilterConfig[];
  readonly textProcessing: TextProcessingConfig;
  readonly searchApproaches: PlatformSearchConfig;
  readonly options: {
    readonly enableCaching: boolean;
    readonly maxCacheSize: number;
    readonly debugMode: boolean;
  };
}

// Runtime filter function type - for converted function strings
export type RuntimeMatchFilter = {
  readonly reason: string;
  readonly filter: (item: TrackWithMatching) => boolean;
}