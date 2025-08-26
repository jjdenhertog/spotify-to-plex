/**
 * Default music search configuration
 * Contains ALL current hardcoded values - preserves exact behavior
 */

import { MusicSearchConfig } from '../types/config';

export const DEFAULT_MUSIC_SEARCH_CONFIG: MusicSearchConfig = {
    // Match filters - exact copy of current hardcoded logic from index.ts:35-54
    // CRITICAL: Order matters! First matching filter wins, others are ignored
    matchFilters: [
    // Full artist matches
        {
            reason: 'Full match on Artist & Title',
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'match' },
                right: { field: 'title', type: 'match' }
            }
        },
        {
            reason: 'Artsit matches and Title contains', // Preserves typo from current code
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'match' },
                right: { field: 'title', type: 'contains' }
            }
        },
        {
            reason: 'Artist matches and Title has 80% similarity',
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'match' },
                right: { field: 'title', type: 'similarity', threshold: 0.8 } // Preserves .8 format
            }
        },
        // Artist contains (so no full match)
        {
            reason: 'Artsit contains and Title matches', // Preserves typo from current code
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'contains' },
                right: { field: 'title', type: 'match' }
            }
        },
        {
            reason: 'Artist contains and Title has 85% similarity',
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'contains' },
                right: { field: 'title', type: 'similarity', threshold: 0.85 }
            }
        },
        {
            reason: 'Artist contains and Title contains and Album contains',
            condition: {
                type: 'and',
                left: {
                    type: 'and',
                    left: { field: 'artist', type: 'contains' },
                    right: { field: 'title', type: 'contains' }
                },
                right: { field: 'album', type: 'contains' }
            }
        },
        // Artist & track similarity scores
        {
            reason: 'Artist and Title has 85% similarity',
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'similarity', threshold: 0.85 },
                right: { field: 'title', type: 'similarity', threshold: 0.85 }
            }
        },
        {
            reason: 'Artist with Title and Title has 85% similarity',
            condition: {
                type: 'and',
                left: { field: 'artistWithTitle', type: 'similarity', threshold: 0.8 },
                right: { field: 'title', type: 'similarity', threshold: 0.9 }
            }
        },
        {
            reason: 'Artist with Title has 85% similarity',
            condition: {
                field: 'artistWithTitle',
                type: 'similarity',
                threshold: 0.95
            }
        },
        // Artist & track contains
        {
            reason: 'Artist and Title contains',
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'contains' },
                right: { field: 'title', type: 'contains' }
            }
        },
        // Album matches & track is a bit similar
        {
            reason: 'Artist has 70% similarity, Album and Title matches',
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'similarity', threshold: 0.7 },
                right: {
                    type: 'and',
                    left: { field: 'album', type: 'match' },
                    right: { field: 'title', type: 'match' }
                }
            }
        },
        {
            reason: 'Artist has 70% similarity, Album matchs and Title has 85% similarity', // Preserves typo from current code
            condition: {
                type: 'and',
                left: { field: 'artist', type: 'similarity', threshold: 0.7 },
                right: {
                    type: 'and',
                    left: { field: 'album', type: 'match' },
                    right: { field: 'title', type: 'similarity', threshold: 0.85 }
                }
            }
        },
        {
            reason: 'Album matches, Artist contains and Title has 80% similiarity', // Preserves typo from current code
            condition: {
                type: 'and',
                left: { field: 'album', type: 'match' },
                right: {
                    type: 'and',
                    left: { field: 'artist', type: 'contains' },
                    right: { field: 'title', type: 'similarity', threshold: 0.8 }
                }
            }
        }
    ],

    // Text processing - exact copy of current hardcoded arrays from filterOutWords.ts
    textProcessing: {
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
    },

    // Search approaches - exact copy from current Plex/Tidal implementations
    searchApproaches: {
    // From PlexMusicSearch index.ts:29-34 and 61-66
        plex: [
            { id: 'normal', filtered: false, trim: false },
            { id: 'filtered', filtered: true, trim: false, removeQuotes: true }, // Plex-specific: removeQuotes
            { id: 'trimmed', filtered: false, trim: true },
            { id: 'filtered_trimmed', filtered: true, trim: true, removeQuotes: true }
        ],
        // From TidalMusicSearch index.ts:49-54 (no removeQuotes flag)
        tidal: [
            { id: 'normal', filtered: false, trim: false },
            { id: 'filtered', filtered: true, trim: false },
            { id: 'trimmed', filtered: false, trim: true },
            { id: 'filtered_trimmed', filtered: true, trim: true }
        ]
    },

    // Options for runtime behavior
    options: {
        enableCaching: true,
        maxCacheSize: 1000,
        debugMode: false
    }
};