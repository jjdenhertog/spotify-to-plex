/**
 * Simple function-based configuration utilities
 * Replaces the over-engineered class-based approach
 */

import fs from 'fs-extra';
const { ensureDir, readFile, writeFile, pathExists } = fs;
import { join } from 'node:path';
import { MusicSearchConfig } from '../types/MusicSearchConfig';
import { RuntimeMatchFilter } from '../types/RuntimeMatchFilter';
import { MatchFilterConfig } from '../types/MatchFilterConfig';
import { TextProcessingConfig } from '../types/TextProcessingConfig';
import { SearchApproachConfig } from '../types/SearchApproachConfig';
import { 
    DEFAULT_MATCH_FILTERS, 
    DEFAULT_TEXT_PROCESSING, 
    DEFAULT_SEARCH_APPROACHES
} from './default-config';
import { TrackWithMatching } from '../types/TrackWithMatching';

// File names
const MATCH_FILTERS_FILE = 'match-filters.json';
const TEXT_PROCESSING_FILE = 'text-processing.json';
const SEARCH_APPROACHES_FILE = 'search-approaches.json';

/**
 * Read and parse a JSON file, return null if file doesn't exist
 */
async function readJSON<T>(filePath: string): Promise<T | null> {
    try {
        if (!(await pathExists(filePath))) {
            return null;
        }

        const content = await readFile(filePath, 'utf8');

        return JSON.parse(content) as T;
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return null;
        }

        throw new Error(`Failed to read ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Write JSON to file atomically
 */
async function writeJSON(filePath: string, data: unknown): Promise<void> {
    try {
        await ensureDir(join(filePath, '..'));
        
        // Write to temporary file first for atomic operation
        const tempPath = `${filePath}.tmp`;
        await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
        
        // Atomic rename
        const nodeFs = await import('node:fs');
        await nodeFs.promises.rename(tempPath, filePath);
    } catch (error) {
        throw new Error(`Failed to write ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Create a filter function from a function string
 */
function createFilterFunction(filterString: string): (item: TrackWithMatching) => boolean {
    try {
        // Create function from string - safer than eval for trusted configuration
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        return new Function('item', `return ${filterString.replace(/^\(item\)\s*=>\s*/, '')};`) as (item: TrackWithMatching) => boolean;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to create filter function from: ${filterString}`, error);

        // Return a filter that never matches on error
        return () => false;
    }
}

/**
 * Get match filters from storage or return defaults
 */
export async function getMatchFilters(storageDir: string): Promise<readonly MatchFilterConfig[]> {
    const filePath = join(storageDir, MATCH_FILTERS_FILE);
    const filters = await readJSON<MatchFilterConfig[]>(filePath);

    return filters ?? DEFAULT_MATCH_FILTERS;
}

/**
 * Get text processing config from storage or return defaults
 */
export async function getTextProcessing(storageDir: string): Promise<TextProcessingConfig> {
    const filePath = join(storageDir, TEXT_PROCESSING_FILE);
    const config = await readJSON<TextProcessingConfig>(filePath);

    return config ?? DEFAULT_TEXT_PROCESSING;
}

/**
 * Get search approaches from storage or return defaults
 */
export async function getSearchApproaches(storageDir: string): Promise<readonly SearchApproachConfig[]> {
    const filePath = join(storageDir, SEARCH_APPROACHES_FILE);
    const approaches = await readJSON<SearchApproachConfig[]>(filePath);

    return approaches ?? DEFAULT_SEARCH_APPROACHES;
}

/**
 * Get complete music search configuration
 */
export async function getMusicSearchConfig(storageDir: string): Promise<MusicSearchConfig> {
    const [matchFilters, textProcessing, searchApproaches] = await Promise.all([
        getMatchFilters(storageDir),
        getTextProcessing(storageDir),
        getSearchApproaches(storageDir)
    ]);

    // Create legacy platform-specific structure for backward compatibility
    const platformApproaches = {
        plex: searchApproaches.filter(a => ['normal', 'filtered', 'trimmed', 'filtered_trimmed'].includes(a.id)),
        tidal: searchApproaches.filter(a => ['normal', 'filtered', 'trimmed', 'filtered_trimmed'].includes(a.id))
    };

    return {
        matchFilters,
        textProcessing,
        searchApproaches: platformApproaches,
        options: {
            enableCaching: true,
            maxCacheSize: 1000,
            debugMode: false
        }
    };
}

/**
 * Get runtime match filters (function strings converted to functions)
 */
export async function getRuntimeFilters(storageDir: string): Promise<RuntimeMatchFilter[]> {
    const matchFilters = await getMatchFilters(storageDir);

    return matchFilters.map(filter => ({
        reason: filter.reason,
        filter: createFilterFunction(filter.filter)
    }));
}

/**
 * Update match filters
 */
export async function updateMatchFilters(storageDir: string, filters: MatchFilterConfig[]): Promise<MatchFilterConfig[]> {
    const filePath = join(storageDir, MATCH_FILTERS_FILE);
    await writeJSON(filePath, filters);

    return filters;
}

/**
 * Update text processing config
 */
export async function updateTextProcessing(storageDir: string, config: TextProcessingConfig): Promise<TextProcessingConfig> {
    const filePath = join(storageDir, TEXT_PROCESSING_FILE);
    await writeJSON(filePath, config);

    return config;
}

/**
 * Update search approaches
 */
export async function updateSearchApproaches(storageDir: string, approaches: SearchApproachConfig[]): Promise<SearchApproachConfig[]> {
    const filePath = join(storageDir, SEARCH_APPROACHES_FILE);
    await writeJSON(filePath, approaches);

    return approaches;
}

/**
 * Reset all configuration to defaults
 */
export async function resetToDefaults(storageDir: string): Promise<MusicSearchConfig> {
    await Promise.all([
        updateMatchFilters(storageDir, DEFAULT_MATCH_FILTERS as MatchFilterConfig[]),
        updateTextProcessing(storageDir, DEFAULT_TEXT_PROCESSING),
        updateSearchApproaches(storageDir, DEFAULT_SEARCH_APPROACHES as SearchApproachConfig[])
    ]);
    
    return getMusicSearchConfig(storageDir);
}