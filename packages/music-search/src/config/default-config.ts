/* eslint-disable custom/no-export-only-files */
/**
 * Default music search configuration split into 3 focused JSON files
 * Simple JSON structure without complex compilation
 */

import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';
import { TextProcessingConfig } from '../types/TextProcessingConfig';
import { SearchApproachConfig } from '../types/SearchApproachConfig';

// Default match filters using expression format (8 streamlined rules)
export const DEFAULT_MATCH_FILTERS: MatchFilterConfig[] = [
    // Tier 1: Exact matches (highest confidence)
    'artist:match AND title:match',

    // Tier 2: Strong artist match with partial title
    'artist:match AND title:contains',
    'artist:match AND title:similarity>=0.8',

    // Tier 3: Partial artist with strong title
    'artist:contains AND title:match',

    // Tier 4: High similarity scores
    'artist:similarity>=0.85 AND title:similarity>=0.85',

    // Tier 5: Multiple partial matches with album context
    'artist:contains AND title:contains AND album:contains',

    // Tier 6: Combined field high similarity
    'artistWithTitle:similarity>=0.9',

    // Tier 7: Album context helps with similarity
    'artist:similarity>=0.7 AND album:match AND title:similarity>=0.85'
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
    ]
};

// Default search approaches - unified list without platform split
export const DEFAULT_SEARCH_APPROACHES: SearchApproachConfig[] = [
    { id: 'normal', filtered: false, trim: false },
    { id: 'basic_filtered', filtered: true, trim: false },
    { id: 'filtered', filtered: true, trim: false, removeQuotes: true },
    { id: 'trimmed', filtered: false, trim: true },
    { id: 'filtered_trimmed', filtered: true, trim: true, removeQuotes: true }
];

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