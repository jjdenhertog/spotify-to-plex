import fs from 'fs-extra';
const { ensureDir, readFile, writeFile, pathExists, remove } = fs;
import { join } from 'node:path';
import { 
    PlexSettings, 
    PlexSettingsUpdate, 
    PlexPlaylists, 
    PlaylistUpdate,
    PlaylistItem,
    PlexConfigOptions 
} from './types.js';

export class PlexConfigManager {
    private readonly baseDir: string;
    private settingsCache: PlexSettings | null = null;
    private playlistsCache: PlexPlaylists | null = null;
    private initialized = false;

    public constructor(options: PlexConfigOptions) {
        this.baseDir = options.storageDir;
    
        // Auto-initialize if preloadCache is true (default)
        if (options.preloadCache !== false) {
            this.initialize().catch(() => {
                // Silent initialization error - will be handled on first access
                // Errors during pre-initialization are non-fatal
            });
        }
    }

    // Static factory method (maintains API compatibility)
    public static create(options: PlexConfigOptions): PlexConfigManager {
        return new PlexConfigManager(options);
    }

    // Initialize and preload cache
    public async initialize(): Promise<void> {
        if (this.initialized) return;
    
        await ensureDir(this.baseDir);
    
        // Preload both settings and playlists concurrently
        await Promise.all([
            this.loadSettingsCache(),
            this.loadPlaylistsCache()
        ]);
    
        this.initialized = true;
    }

    // SETTINGS METHODS

    public async getSettings(): Promise<PlexSettings> {
        if (!this.initialized) await this.initialize();
    
        if (this.settingsCache === null) {
            await this.loadSettingsCache();
        }
    
        return this.settingsCache ?? {};
    }

    public async updateSettings(settings: PlexSettingsUpdate): Promise<PlexSettings> {
        if (!this.initialized) await this.initialize();
    
        const current = await this.getSettings();
        const updated = { ...current, ...settings };
    
        await this.writeAtomicJSON('plex.json', updated);
        this.settingsCache = updated;
    
        return updated;
    }

    public async hasValidConnection(): Promise<boolean> {
        const settings = await this.getSettings();

        return !!(settings.uri && settings.token);
    }

    public async clearSettings(): Promise<void> {
        if (!this.initialized) await this.initialize();
    
        await this.deleteFile('plex.json');
        this.settingsCache = {};
    }

    // PLAYLIST METHODS

    public async getPlaylists(): Promise<PlexPlaylists> {
        if (!this.initialized) await this.initialize();
    
        if (this.playlistsCache === null) {
            await this.loadPlaylistsCache();
        }
    
        return this.playlistsCache ?? { data: [] };
    }

    public async addPlaylist(type: string, id: string, plexId: string): Promise<void> {
        if (!this.initialized) await this.initialize();
    
        const current = await this.getPlaylists();
        const existingData = current.data ?? [];
    
        // Remove existing item with same id
        const filtered = existingData.filter(existing => existing.id !== id);
        const newItem: PlaylistItem = { type, id, plex: plexId };
    
        const updated: PlexPlaylists = { data: [...filtered, newItem] };
    
        await this.writeAtomicJSON('playlists.json', updated);
        this.playlistsCache = updated;
    }

    public async removePlaylist(id: string): Promise<void> {
        if (!this.initialized) await this.initialize();
    
        const current = await this.getPlaylists();
        const existingData = current.data ?? [];
        const filtered = existingData.filter(existing => existing.id !== id);
    
        const updated: PlexPlaylists = { data: filtered };
    
        await this.writeAtomicJSON('playlists.json', updated);
        this.playlistsCache = updated;
    }

    public async updatePlaylist(id: string, updates: Partial<PlaylistUpdate>): Promise<void> {
        if (!this.initialized) await this.initialize();
    
        const current = await this.getPlaylists();
        const existingData = current.data ?? [];
        const index = existingData.findIndex(p => p.id === id);
    
        if (index === -1) {
            throw new Error(`Playlist with id ${id} not found`);
        }
    
        const updatedItem: PlaylistItem = {
            ...existingData[index]!,
            ...(updates.type && { type: updates.type }),
            ...(updates.id && { id: updates.id }),
            ...(updates.plex && { plex: updates.plex })
        };
    
        const newData = [...existingData];
        newData[index] = updatedItem;
    
        const updated: PlexPlaylists = { data: newData };
    
        await this.writeAtomicJSON('playlists.json', updated);
        this.playlistsCache = updated;
    }

    public async clearPlaylists(): Promise<void> {
        if (!this.initialized) await this.initialize();
    
        await this.deleteFile('playlists.json');
        this.playlistsCache = { data: [] };
    }

    // PRIVATE HELPER METHODS

    private async loadSettingsCache(): Promise<void> {
        this.settingsCache = await this.readJSON<PlexSettings>('plex.json') ?? {};
    }

    private async loadPlaylistsCache(): Promise<void> {
        this.playlistsCache = await this.readJSON<PlexPlaylists>('playlists.json') ?? { data: [] };
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
                await remove(filePath);
            }
        } catch (error) {
            throw new Error(`Failed to delete ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}


export {type PlexConfigOptions} from './types.js';