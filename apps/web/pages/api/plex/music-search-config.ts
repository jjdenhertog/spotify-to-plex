import { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Types for the configuration
type MatchFilter = {
    id: string;
    name: string;
    enabled: boolean;
    artistSimilarity?: number;
    titleSimilarity?: number;
    artistWithTitleSimilarity?: number;
    useContains?: boolean;
    useArtistMatch?: boolean;
    reason: string;
}

type TextProcessingConfig = {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[];
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;
        removeQuotes: boolean;
    };
}

type SearchApproachConfig = {
    name: string;
    filtered: boolean;
    cutOffSeperators: boolean; // Note: preserving typo from original
    removeQuotes: boolean;
}

type MusicSearchConfig = {
    matchFilters: MatchFilter[];
    textProcessing: TextProcessingConfig;
    searchApproaches: {
        plex: SearchApproachConfig[];
        tidal: SearchApproachConfig[];
    };
}

// Default configuration based on the current hardcoded logic
const getDefaultConfig = (): MusicSearchConfig => ({
    matchFilters: [
        {
            id: "exact-match-high",
            name: "High Confidence Exact Match",
            enabled: true,
            artistSimilarity: 0.95,
            titleSimilarity: 0.95,
            reason: "High confidence exact match"
        },
        {
            id: "artist-title-combination",
            name: "Artist + Title Combination",
            enabled: true,
            artistWithTitleSimilarity: 0.8,
            titleSimilarity: 0.9,
            reason: "Artist with title match"
        },
        {
            id: "strong-similarity",
            name: "Strong Similarity Match",
            enabled: true,
            artistSimilarity: 0.85,
            titleSimilarity: 0.85,
            reason: "Strong similarity match"
        },
        {
            id: "title-contains",
            name: "Title Contains Match",
            enabled: true,
            titleSimilarity: 0.8,
            useContains: true,
            reason: "Title contains match"
        },
        {
            id: "artist-match",
            name: "Artist Match",
            enabled: true,
            artistSimilarity: 0.9,
            useArtistMatch: true,
            reason: "Artist match"
        },
        {
            id: "medium-similarity",
            name: "Medium Similarity Match",
            enabled: true,
            artistSimilarity: 0.75,
            titleSimilarity: 0.8,
            reason: "Medium similarity match"
        },
        {
            id: "alternative-artist",
            name: "Alternative Artist Match",
            enabled: true,
            artistSimilarity: 0.8,
            titleSimilarity: 0.85,
            reason: "Alternative artist match"
        },
        {
            id: "loose-title",
            name: "Loose Title Match",
            enabled: true,
            titleSimilarity: 0.7,
            reason: "Loose title match"
        },
        {
            id: "artist-contains",
            name: "Artist Contains Match",
            enabled: true,
            artistSimilarity: 0.8,
            useContains: true,
            reason: "Artist contains match"
        },
        {
            id: "very-loose",
            name: "Very Loose Match",
            enabled: true,
            artistSimilarity: 0.6,
            titleSimilarity: 0.7,
            reason: "Very loose match"
        },
        {
            id: "partial-match",
            name: "Partial Match",
            enabled: true,
            artistSimilarity: 0.5,
            titleSimilarity: 0.6,
            reason: "Partial match"
        },
        {
            id: "last-resort-title",
            name: "Last Resort Title",
            enabled: true,
            titleSimilarity: 0.5,
            reason: "Last resort title match"
        },
        {
            id: "last-resort-artist",
            name: "Last Resort Artist",
            enabled: true,
            artistSimilarity: 0.4,
            reason: "Last resort artist match"
        }
    ],
    textProcessing: {
        filterOutWords: [
            "remaster", "remastered", "remix", "edit", "version", "feat", "featuring",
            "ft", "radio", "explicit", "clean", "acoustic", "live", "demo", "instrumental",
            "karaoke", "cover", "tribute", "mono", "stereo", "deluxe", "bonus", "extended"
        ],
        filterOutQuotes: [`"`, `'`, `'`, `'`, `"`, `"`, `«`, `»`, `‚`, `‛`, `„`, `‟`],
        cutOffSeparators: [" - ", " – ", " — ", " (", " [", " feat", " ft", " featuring"],
        processing: {
            filtered: true,
            cutOffSeperators: true,  // Note: preserving typo for backward compatibility
            removeQuotes: true
        }
    },
    searchApproaches: {
        plex: [
            {
                name: "Filtered with Quotes Removed",
                filtered: true,
                cutOffSeperators: true,
                removeQuotes: true
            },
            {
                name: "Filtered with Separators Cut",
                filtered: true,
                cutOffSeperators: true,
                removeQuotes: false
            },
            {
                name: "Basic Filtered",
                filtered: true,
                cutOffSeperators: false,
                removeQuotes: false
            },
            {
                name: "Unfiltered",
                filtered: false,
                cutOffSeperators: false,
                removeQuotes: false
            }
        ],
        tidal: [
            {
                name: "Filtered with Separators Cut",
                filtered: true,
                cutOffSeperators: true,
                removeQuotes: false
            },
            {
                name: "Basic Filtered",
                filtered: true,
                cutOffSeperators: false,
                removeQuotes: false
            },
            {
                name: "Unfiltered",
                filtered: false,
                cutOffSeperators: false,
                removeQuotes: false
            }
        ]
    }
});

// Configuration file path
const getConfigPath = (): string => {
    // Try to use SETTINGS_DIR from environment, fallback to current directory
    const settingsDir = process.env.SETTINGS_DIR || process.cwd();

    return join(settingsDir, 'music-search-config.json');
};

// Load configuration from file or return default
const loadConfig = (): MusicSearchConfig => {
    try {
        const configPath = getConfigPath();
        if (existsSync(configPath)) {
            const configData = readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            // Validate and merge with defaults to ensure all fields are present
            const defaultConfig = getDefaultConfig();

            return {
                ...defaultConfig,
                ...config,
                matchFilters: config.matchFilters || defaultConfig.matchFilters,
                textProcessing: {
                    ...defaultConfig.textProcessing,
                    ...config.textProcessing
                },
                searchApproaches: {
                    plex: config.searchApproaches?.plex || defaultConfig.searchApproaches.plex,
                    tidal: config.searchApproaches?.tidal || defaultConfig.searchApproaches.tidal
                }
            };
        }
    } catch (_error) {
        // Error handling - handled by Next.js error boundary
    }
    
    return getDefaultConfig();
};

// Save configuration to file
const saveConfig = (config: MusicSearchConfig): void => {
    try {
        const configPath = getConfigPath();
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (_error) {
        // Error handling - handled by Next.js error boundary
        throw new Error('Failed to save configuration');
    }
};

// Validate configuration structure
const validateConfig = (config: any): config is MusicSearchConfig => {
    if (!config || typeof config !== 'object') return false;
    
    if (!Array.isArray(config.matchFilters)) return false;
    
    if (!config.textProcessing || typeof config.textProcessing !== 'object') return false;
    
    if (!config.searchApproaches || 
        !Array.isArray(config.searchApproaches.plex) || 
        !Array.isArray(config.searchApproaches.tidal)) {
        return false;
    }
    
    return true;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            // Load and return current configuration
            const config = loadConfig();

            return res.status(200).json(config);
            
        } else if (req.method === 'POST') {
            // Save new configuration
            const newConfig = req.body;
            
            if (!validateConfig(newConfig)) {
                return res.status(400).json({ error: 'Invalid configuration format' });
            }
            
            saveConfig(newConfig);

            return res.status(200).json({ success: true, message: 'Configuration saved successfully' });
            
        }
 
        res.setHeader('Allow', ['GET', 'POST']);

        return res.status(405).json({ error: 'Method not allowed' });
        
        
    } catch (_error) {
        // Error handling - handled by Next.js error boundary

        return res.status(500).json({ 
            error: 'Internal server error', 
            message: _error instanceof Error ? _error.message : 'Unknown error' 
        });
    }
}