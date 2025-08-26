/**
 * Music Search Configuration Manager
 * Integrates with existing PlexConfigManager pattern for consistency
 */

import fs from 'fs-extra';
const { ensureDir, readFile, writeFile, pathExists } = fs;
import { join } from 'node:path';
import { MusicSearchConfig, RuntimeMatchFilter } from '../types/config';
import { DEFAULT_MUSIC_SEARCH_CONFIG } from './default-config';
import { ConfigCompiler } from './config-compiler';

export class MusicSearchConfigManager {
    private readonly baseDir: string;
    private readonly configFileName = 'music-search.json';
    private configCache: MusicSearchConfig | null = null;
    private runtimeFiltersCache: RuntimeMatchFilter[] | null = null;
    private initialized = false;

    public constructor(options: { storageDir: string; preloadCache?: boolean }) {
        this.baseDir = options.storageDir;
    
        // Auto-initialize if preloadCache is true (default)
        if (options.preloadCache !== false) {
            this.initialize().catch(() => {
                // Silent initialization error - will be handled on first access
                // Errors during pre-initialization are non-fatal
            });
        }
    }

    // Static factory method (maintains API compatibility with PlexConfigManager)
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
   * Returns default config if file doesn't exist or fails to load
   */
    public async getConfig(): Promise<MusicSearchConfig> {
        if (!this.initialized) await this.initialize();

        if (this.configCache === null) {
            await this.loadConfigCache();
        }

        return this.configCache ?? DEFAULT_MUSIC_SEARCH_CONFIG;
    }

    /**
   * Get compiled runtime match filters ready for execution
   * Caches compiled filters for performance
   */
    public async getRuntimeFilters(): Promise<RuntimeMatchFilter[]> {
        if (!this.initialized) await this.initialize();

        if (this.runtimeFiltersCache === null) {
            const config = await this.getConfig();
            this.runtimeFiltersCache = ConfigCompiler.compileMatchFilters(config.matchFilters);
        }

        return this.runtimeFiltersCache;
    }

    /**
   * Update music search configuration
   * Validates config before saving and recompiles runtime filters
   */
    public async updateConfig(config: Partial<MusicSearchConfig>): Promise<MusicSearchConfig> {
        if (!this.initialized) await this.initialize();

        const current = await this.getConfig();
        const updated = { 
            ...current, 
            ...config,
            // Ensure nested objects are properly merged
            ...(config.textProcessing && {
                textProcessing: { ...current.textProcessing, ...config.textProcessing }
            }),
            ...(config.searchApproaches && {
                searchApproaches: { ...current.searchApproaches, ...config.searchApproaches }
            }),
            ...(config.options && {
                options: { ...current.options, ...config.options }
            })
        };

        // Validate configuration before saving
        if (config.matchFilters) {
            const validation = ConfigCompiler.validateConfig(config.matchFilters);
            if (!validation.isValid) {
                throw new Error(`Invalid match filters configuration: ${validation.errors.join(', ')}`);
            }
        }

        await this.writeAtomicJSON(this.configFileName, updated);
        this.configCache = updated;
        this.runtimeFiltersCache = null; // Clear cache to force recompilation

        return updated;
    }

    /**
   * Reset to default configuration
   */
    public async resetToDefaults(): Promise<MusicSearchConfig> {
        if (!this.initialized) await this.initialize();

        await this.writeAtomicJSON(this.configFileName, DEFAULT_MUSIC_SEARCH_CONFIG);
        this.configCache = DEFAULT_MUSIC_SEARCH_CONFIG;
        this.runtimeFiltersCache = null;

        return DEFAULT_MUSIC_SEARCH_CONFIG;
    }

    /**
   * Clear configuration file and cache
   */
    public async clearConfig(): Promise<void> {
        if (!this.initialized) await this.initialize();

        await this.deleteFile(this.configFileName);
        this.configCache = null;
        this.runtimeFiltersCache = null;
    }

    /**
   * Validate current configuration
   */
    public async validateConfig(): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
        const config = await this.getConfig();
        const result = ConfigCompiler.validateConfig(config.matchFilters);

        return {
            isValid: result.isValid,
            errors: [...result.errors], // Convert readonly to mutable array
            warnings: [...result.warnings] // Convert readonly to mutable array
        };
    }

    /**
   * Export configuration as JSON string for backup/sharing
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

    private async loadConfigCache(): Promise<void> {
        this.configCache = await this.readJSON<MusicSearchConfig>(this.configFileName) ?? DEFAULT_MUSIC_SEARCH_CONFIG;
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