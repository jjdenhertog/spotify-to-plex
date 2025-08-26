/**
 * Configuration schema for music search functionality
 * Captures all current hardcoded logic without any loss
 */

import { TrackWithMatching } from './TrackWithMatching';

// Match filter configuration - preserves exact current logic
export type MatchFilterConfig = {
  readonly reason: string;
  readonly condition: MatchCondition;
};

// Represents the boolean logic conditions from current hardcoded filters
export type MatchCondition = 
  // Full artist matches
  | { type: 'and'; left: ArtistMatchCondition; right: TitleMatchCondition }
  // Complex multi-field conditions
  | { type: 'and'; left: MatchCondition; right: MatchCondition }
  | { type: 'or'; left: MatchCondition; right: MatchCondition }
  // Single field conditions
  | ArtistMatchCondition 
  | TitleMatchCondition 
  | AlbumMatchCondition
  | ArtistWithTitleMatchCondition;

export type ArtistMatchCondition = 
  | { field: 'artist'; type: 'match' }
  | { field: 'artist'; type: 'contains' }
  | { field: 'artist'; type: 'similarity'; threshold: number };

export type TitleMatchCondition = 
  | { field: 'title'; type: 'match' }
  | { field: 'title'; type: 'contains' }
  | { field: 'title'; type: 'similarity'; threshold: number };

export type AlbumMatchCondition = 
  | { field: 'album'; type: 'match' }
  | { field: 'album'; type: 'contains' }
  | { field: 'album'; type: 'similarity'; threshold: number };

export type ArtistWithTitleMatchCondition = 
  | { field: 'artistWithTitle'; type: 'similarity'; threshold: number };

// Text processing configuration - captures current hardcoded arrays and logic
export type TextProcessingConfig = {
  readonly filterOutWords: readonly string[];
  readonly filterOutQuotes: readonly string[];
  readonly cutOffSeparators: readonly string[];
  readonly processing: {
    readonly filtered: boolean;
    readonly cutOffSeperators: boolean; // Preserves typo from current code
    readonly removeQuotes: boolean;
  };
};

// Search approach configuration - supports Plex vs Tidal differences
export type SearchApproachConfig = {
  readonly id: string;
  readonly filtered?: boolean;
  readonly trim?: boolean;
  readonly ignoreQuotes?: boolean;
  readonly removeQuotes?: boolean; // Plex-specific flag
  readonly force?: boolean; // Plex-specific flag
};

// Platform-specific search approaches
export type PlatformSearchConfig = {
  readonly plex: readonly SearchApproachConfig[];
  readonly tidal: readonly SearchApproachConfig[];
};

// Complete music search configuration
export type MusicSearchConfig = {
  readonly matchFilters: readonly MatchFilterConfig[];
  readonly textProcessing: TextProcessingConfig;
  readonly searchApproaches: PlatformSearchConfig;
  readonly options: {
    readonly enableCaching: boolean;
    readonly maxCacheSize: number;
    readonly debugMode: boolean;
  };
};

// Configuration loading options for integration with PlexConfigManager
export type MusicSearchConfigOptions = {
  readonly configFile?: string;
  readonly useDefaults: boolean;
  readonly validateSchema: boolean;
};

// Runtime filter function type - for converting config to executable logic
export type RuntimeMatchFilter = {
  readonly reason: string;
  readonly filter: (item: TrackWithMatching) => boolean;
};

// Configuration validation result
export type ConfigValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
};