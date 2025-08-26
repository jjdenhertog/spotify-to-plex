/**
 * Simple Music Search Configuration Manager
 * Handles 3 separate JSON configuration files and converts function strings to runtime functions
 */

import fs from 'fs-extra';
const { ensureDir, readFile, writeFile, pathExists } = fs;
import { join } from 'node:path';
import { 
    MusicSearchConfig, 
    RuntimeMatchFilter, 
    MatchFilterConfig, 
    TextProcessingConfig, 
    SearchApproachConfig 
} from '../types/config';
import { 
    DEFAULT_MATCH_FILTERS, 
    DEFAULT_TEXT_PROCESSING, 
    DEFAULT_SEARCH_APPROACHES,
    DEFAULT_MUSIC_SEARCH_CONFIG 
} from './default-config';
import { TrackWithMatching } from '../types/TrackWithMatching';

export class MusicSearchConfigManager {
    private readonly baseDir: string;
    private readonly matchFiltersFileName = 'match-filters.json';
    private readonly textProcessingFileName = 'text-processing.json';
    private readonly searchApproachesFileName = 'search-approaches.json';
    private configCache: MusicSearchConfig | null = null;
    private runtimeFiltersCache: RuntimeMatchFilter[] | null = null;
    private initialized = false;

    public constructor(options: { storageDir: string; preloadCache?: boolean }) {
        this.baseDir = options.storageDir;
    
        // Auto-initialize if preloadCache is true (default)
        if (options.preloadCache !== false) {
            this.initialize().catch(() => {
                // Silent initialization error - will be handled on first access
            });
        }
    }

    // Static factory method (maintains API compatibility)
    public static create(options: { storageDir: string; preloadCache?: boolean }): MusicSearchConfigManager {
        return new MusicSearchConfigManager(options);
    }

    // Initialize and preload cache
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        await ensureDir(this.baseDir);
        await this.loadConfigCache();
    
        this.initialized = true;
    }

    /**
     * Get the complete music search configuration
     * Returns default config if files don't exist or fail to load
     */
    public async getConfig(): Promise<MusicSearchConfig> {
        if (!this.initialized) await this.initialize();

        if (this.configCache === null) {
            await this.loadConfigCache();
        }

        return this.configCache ?? DEFAULT_MUSIC_SEARCH_CONFIG;
    }

    /**
     * Get match filters configuration
     */
    public async getMatchFilters(): Promise<readonly MatchFilterConfig[]> {
        if (!this.initialized) await this.initialize();

        const filters = await this.readJSON<MatchFilterConfig[]>(this.matchFiltersFileName);

        return filters ?? DEFAULT_MATCH_FILTERS;
    }

    /**
     * Get text processing configuration
     */
    public async getTextProcessing(): Promise<TextProcessingConfig> {
        if (!this.initialized) await this.initialize();

        const config = await this.readJSON<TextProcessingConfig>(this.textProcessingFileName);

        return config ?? DEFAULT_TEXT_PROCESSING;
    }

    /**
     * Get search approaches configuration
     */
    public async getSearchApproaches(): Promise<readonly SearchApproachConfig[]> {
        if (!this.initialized) await this.initialize();

        const approaches = await this.readJSON<SearchApproachConfig[]>(this.searchApproachesFileName);

        return approaches ?? DEFAULT_SEARCH_APPROACHES;
    }

    /**
     * Get runtime match filters by converting function strings to functions
     * Caches compiled filters for performance
     */
    public async getRuntimeFilters(): Promise<RuntimeMatchFilter[]> {
        if (!this.initialized) await this.initialize();

        if (this.runtimeFiltersCache === null) {
            const matchFilters = await this.getMatchFilters();
            this.runtimeFiltersCache = this.compileFunctionStrings(matchFilters);
        }

        return this.runtimeFiltersCache;
    }

    /**
     * Update match filters configuration
     */
    public async updateMatchFilters(filters: MatchFilterConfig[]): Promise<MatchFilterConfig[]> {
        if (!this.initialized) await this.initialize();
        
        await this.writeAtomicJSON(this.matchFiltersFileName, filters);
        this.configCache = null; // Clear cache
        this.runtimeFiltersCache = null; // Clear runtime cache
        
        return filters;
    }

    /**
     * Update text processing configuration
     */
    public async updateTextProcessing(config: TextProcessingConfig): Promise<TextProcessingConfig> {
        if (!this.initialized) await this.initialize();
        
        await this.writeAtomicJSON(this.textProcessingFileName, config);
        this.configCache = null; // Clear cache
        
        return config;
    }

    /**
     * Update search approaches configuration
     */
    public async updateSearchApproaches(approaches: SearchApproachConfig[]): Promise<SearchApproachConfig[]> {
        if (!this.initialized) await this.initialize();
        
        await this.writeAtomicJSON(this.searchApproachesFileName, approaches);
        this.configCache = null; // Clear cache
        
        return approaches;
    }

    /**
     * Update music search configuration (legacy method for backward compatibility)
     */
    public async updateConfig(config: Partial<MusicSearchConfig>): Promise<MusicSearchConfig> {
        if (!this.initialized) await this.initialize();

        if (config.matchFilters) {
            await this.updateMatchFilters(config.matchFilters as MatchFilterConfig[]);
        }

        if (config.textProcessing) {
            await this.updateTextProcessing(config.textProcessing);
        }

        if (config.searchApproaches) {
            // Convert platform-specific to unified approach
            const unified = [...(config.searchApproaches.plex || []), ...(config.searchApproaches.tidal || [])];
            const uniqueApproaches = unified.filter((approach, index, self) => 
                self.findIndex(a => a.id === approach.id) === index
            );
            await this.updateSearchApproaches(uniqueApproaches);
        }

        return this.getConfig();
    }

    /**
     * Reset to default configuration
     */
    public async resetToDefaults(): Promise<MusicSearchConfig> {
        if (!this.initialized) await this.initialize();

        await this.writeAtomicJSON(this.matchFiltersFileName, DEFAULT_MATCH_FILTERS);
        await this.writeAtomicJSON(this.textProcessingFileName, DEFAULT_TEXT_PROCESSING);
        await this.writeAtomicJSON(this.searchApproachesFileName, DEFAULT_SEARCH_APPROACHES);
        
        this.configCache = null;
        this.runtimeFiltersCache = null;

        return this.getConfig();
    }

    /**
     * Clear configuration files and cache
     */
    public async clearConfig(): Promise<void> {
        if (!this.initialized) await this.initialize();

        await this.deleteFile(this.matchFiltersFileName);
        await this.deleteFile(this.textProcessingFileName);
        await this.deleteFile(this.searchApproachesFileName);
        this.configCache = null;
        this.runtimeFiltersCache = null;
    }

    /**
     * Export configuration as JSON string
     */
    public async exportConfig(): Promise<string> {
        const config = await this.getConfig();

        return JSON.stringify(config, null, 2);
    }

    /**
     * Import configuration from JSON string
     */
    public async importConfig(jsonConfig: string): Promise<MusicSearchConfig> {
        try {
            const config = JSON.parse(jsonConfig) as MusicSearchConfig;

            return await this.updateConfig(config);
        } catch (error) {
            throw new Error(`Invalid JSON configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // PRIVATE HELPER METHODS

    /**
     * Convert function strings to runtime functions
     * Simple eval-based approach - function strings are trusted configuration
     */
    private compileFunctionStrings(filters: readonly MatchFilterConfig[]): RuntimeMatchFilter[] {
        return filters.map(filter => ({
            reason: filter.reason,
            filter: this.createFilterFunction(filter.filter)
        }));
    }

    /**
     * Create filter function from string
     * Uses Function constructor for clean evaluation
     */
    private createFilterFunction(filterString: string): (item: TrackWithMatching) => boolean {
        try {
            // Create function from string - safer than eval for trusted configuration
            return new Function('item', `return ${filterString.replace(/^\(item\)\s*=>\s*/, '')};`) as (item: TrackWithMatching) => boolean;
        } catch (error) {
            console.warn(`Failed to create filter function from: ${filterString}`, error);

            // Return a filter that never matches on error
            return () => false;
        }
    }

    private async loadConfigCache(): Promise<void> {
        const [matchFilters, textProcessing, searchApproaches] = await Promise.all([
            this.getMatchFilters(),
            this.getTextProcessing(),
            this.getSearchApproaches()
        ]);

        // Create legacy platform-specific structure for backward compatibility
        const platformApproaches = {
            plex: searchApproaches.filter(a => ['normal', 'filtered', 'trimmed', 'filtered_trimmed'].includes(a.id)),
            tidal: searchApproaches.filter(a => ['normal', 'filtered', 'trimmed', 'filtered_trimmed'].includes(a.id))
        };

        this.configCache = {
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

    private async readJSON<T>(fileName: string): Promise<T | null> {
        try {
            const filePath = join(this.baseDir, fileName);
      
            if (!(await pathExists(filePath))) {
                return null;
            }

            const content = await readFile(filePath, 'utf8');

            return JSON.parse(content) as T;
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                return null;
            }

            throw new Error(`Failed to read ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async writeAtomicJSON(fileName: string, data: unknown): Promise<void> {
        try {
            const filePath = join(this.baseDir, fileName);
      
            // Write to temporary file first for atomic operation
            const tempPath = `${filePath}.tmp`;
            await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
      
            // Atomic rename
            const nodeFs = await import('node:fs');
            await nodeFs.promises.rename(tempPath, filePath);
        } catch (error) {
            throw new Error(`Failed to write ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async deleteFile(fileName: string): Promise<void> {
        try {
            const filePath = join(this.baseDir, fileName);
      
            if (await pathExists(filePath)) {
                await fs.remove(filePath);
            }
        } catch (error) {
            throw new Error(`Failed to delete ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}