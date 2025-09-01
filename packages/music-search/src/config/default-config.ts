/* eslint-disable custom/no-export-only-files */
/**
 * Default music search configuration split into 3 focused JSON files
 * Simple JSON structure without complex compilation
 */

import { MatchFilterConfig } from '../types/MatchFilterConfig';
import { TextProcessingConfig } from '../types/TextProcessingConfig';
import { SearchApproachConfig } from '../types/SearchApproachConfig';

// Default match filters using optimized expression format (8 streamlined rules)
export const DEFAULT_MATCH_FILTERS: readonly MatchFilterConfig[] = [
    // Tier 1: Exact matches (highest confidence)
    {
        reason: 'Exact artist and title match',
        expression: 'artist:match AND title:match'
    },
    
    // Tier 2: Strong artist match with partial title
    {
        reason: 'Exact artist with partial title match',
        expression: 'artist:match AND title:contains'
    },
    {
        reason: 'Exact artist with similar title (80%+)',
        expression: 'artist:match AND title:similarity>=0.8'
    },
    
    // Tier 3: Partial artist with strong title
    {
        reason: 'Partial artist with exact title match',
        expression: 'artist:contains AND title:match'
    },
    
    // Tier 4: High similarity scores
    {
        reason: 'Both artist and title very similar (85%+)',
        expression: 'artist:similarity>=0.85 AND title:similarity>=0.85'
    },
    
    // Tier 5: Multiple partial matches with album context
    {
        reason: 'All fields partially match (artist, title, album)',
        expression: 'artist:contains AND title:contains AND album:contains'
    },
    
    // Tier 6: Combined field high similarity
    {
        reason: 'Combined artist-title field very similar (90%+)',
        expression: 'artistWithTitle:similarity>=0.9'
    },
    
    // Tier 7: Album context helps with similarity
    {
        reason: 'Album match with good artist and title similarity',
        expression: 'artist:similarity>=0.7 AND album:match AND title:similarity>=0.85'
    }
];

// Legacy filters for backward compatibility and migration testing
export const LEGACY_DEFAULT_MATCH_FILTERS: readonly MatchFilterConfig[] = [
    // Full artist matches
    {
        reason: 'Full match on Artist & Title',
        filter: '(item) => item.matching.artist.match && item.matching.title.match'
    },
    {
        reason: 'Artsit matches and Title contains', // Preserves typo
        filter: '(item) => item.matching.artist.match && item.matching.title.contains'
    },
    {
        reason: 'Artist matches and Title has 80% similarity',
        filter: '(item) => item.matching.artist.match && (item.matching.title.similarity ?? 0) >= 0.8'
    },
    // Artist contains (so no full match)
    {
        reason: 'Artsit contains and Title matches', // Preserves typo
        filter: '(item) => item.matching.artist.contains && item.matching.title.match'
    },
    {
        reason: 'Artist contains and Title has 85% similarity',
        filter: '(item) => item.matching.artist.contains && (item.matching.title.similarity ?? 0) >= 0.85'
    },
    {
        reason: 'Artist contains and Title contains and Album contains',
        filter: '(item) => item.matching.artist.contains && item.matching.title.contains && item.matching.album.contains'
    },
    // Artist & track similarity scores
    {
        reason: 'Artist and Title has 85% similarity',
        filter: '(item) => (item.matching.artist.similarity ?? 0) >= 0.85 && (item.matching.title.similarity ?? 0) >= 0.85'
    },
    {
        reason: 'Artist with Title and Title has 85% similarity',
        filter: '(item) => (item.matching.artistWithTitle.similarity ?? 0) >= 0.8 && (item.matching.title.similarity ?? 0) >= 0.9'
    },
    {
        reason: 'Artist with Title has 85% similarity',
        filter: '(item) => (item.matching.artistWithTitle.similarity ?? 0) >= 0.95'
    },
    // Artist & track contains
    {
        reason: 'Artist and Title contains',
        filter: '(item) => item.matching.artist.contains && item.matching.title.contains'
    },
    // Album matches & track is a bit similar
    {
        reason: 'Artist has 70% similarity, Album and Title matches',
        filter: '(item) => (item.matching.artist.similarity ?? 0) >= 0.7 && item.matching.album.match && item.matching.title.match'
    },
    {
        reason: 'Artist has 70% similarity, Album matchs and Title has 85% similarity', // Preserves typo
        filter: '(item) => (item.matching.artist.similarity ?? 0) >= 0.7 && item.matching.album.match && (item.matching.title.similarity ?? 0) >= 0.85'
    },
    {
        reason: 'Album matches, Artist contains and Title has 80% similiarity', // Preserves typo
        filter: '(item) => item.matching.album.match && item.matching.artist.contains && (item.matching.title.similarity ?? 0) >= 0.8'
    }
];

// Default text processing - exact copy of current hardcoded arrays
export const DEFAULT_TEXT_PROCESSING: TextProcessingConfig = {
    filterOutWords: [
        "original mix",
        "radio edit", 
        "single edit",
        "alternate mix",
        "remastered",
        "remaster",
        "single version",
        "retail mix",
        "quartet"
    ],
    filterOutQuotes: [
        "'", '"', "´", "`"
    ],
    cutOffSeparators: [
        "(",
        "[", 
        "{",
        "-"
    ],
    processing: {
        filtered: false,
        cutOffSeperators: false, // Preserves typo from current code
        removeQuotes: false
    }
};

// Default search approaches - unified list without platform split
export const DEFAULT_SEARCH_APPROACHES: readonly SearchApproachConfig[] = [
    { id: 'normal', filtered: false, trim: false },
    { id: 'filtered', filtered: true, trim: false, removeQuotes: true },
    { id: 'trimmed', filtered: false, trim: true },
    { id: 'filtered_trimmed', filtered: true, trim: true, removeQuotes: true },
    { id: 'basic_filtered', filtered: true, trim: false },
    { id: 'unfiltered', filtered: false, trim: false }
];

// Legacy export for backward compatibility
export const DEFAULT_MUSIC_SEARCH_CONFIG = {
    matchFilters: DEFAULT_MATCH_FILTERS,
    textProcessing: DEFAULT_TEXT_PROCESSING,
    searchApproaches: {
        plex: DEFAULT_SEARCH_APPROACHES.filter(a => ['normal', 'filtered', 'trimmed', 'filtered_trimmed'].includes(a.id)),
        tidal: DEFAULT_SEARCH_APPROACHES.filter(a => ['normal', 'filtered', 'trimmed', 'filtered_trimmed'].includes(a.id))
    },
    options: {
        enableCaching: true,
        maxCacheSize: 1000,
        debugMode: false
    }
};