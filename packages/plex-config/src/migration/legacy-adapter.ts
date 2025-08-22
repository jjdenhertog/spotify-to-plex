import { PlexConfigManager } from '../core/plex-config-manager';
import { PlexSettings, PlexSettingsUpdate, PlexPlaylists } from '../types';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Legacy adapter to provide backward compatibility with the old global plex object
 * This allows gradual migration from the old implementation
 */
export class LegacyPlexAdapter {
    private readonly manager: PlexConfigManager;
    public _settings: PlexSettings = {};
    public _playlists: PlexPlaylists = { data: [] };

    public constructor(manager: PlexConfigManager) {
        this.manager = manager;
    
        // Initialize cached values
        this.initializeCache();
    }

    public async initializeCache(): Promise<void> {
        try {
            // Initialize the manager for synchronous access
            await this.manager.initialize();
      
            // Get initial values
            this._settings = await this.manager.getSettings();
            this._playlists = await this.manager.getPlaylists();
      
            // Subscribe to updates
            this.manager.on('settings:updated', (event) => {
                this._settings = event.data;
            });
      
            this.manager.on('playlist:updated', () => {
                // Refresh playlists cache on any update
                this.manager.getPlaylists().then(playlists => {
                    this._playlists = playlists;
                });
            });
        } catch (error) {
            console.error('Failed to initialize legacy adapter cache:', error);
        }
    }

    // Synchronous getters for backward compatibility
    public get settings(): PlexSettings {
        return this._settings;
    }

    public get playlists(): PlexPlaylists {
        return this._playlists;
    }

    // Legacy methods
    public saveConfig(settings: PlexSettingsUpdate): void {
    // Fire and forget for backward compatibility
        this.manager.updateSettings(settings)
            .then(updated => {
                this._settings = updated;
            })
            .catch((error: unknown) => {
                console.error('Failed to save config:', error);
            });
    }

    public savePlaylist(type: string, id: string, plexId: string): void {
    // Fire and forget for backward compatibility
        this.manager.addPlaylist(type, id, plexId)
            .then(() => {
                // Refresh cache
                return this.manager.getPlaylists();
            })
            .then(playlists => {
                this._playlists = playlists;
            })
            .catch((error: unknown) => {
                console.error('Failed to save playlist:', error);
            });
    }
}

/**
 * Create a legacy plex object that mimics the old global interface
 */
export function createLegacyPlex(storageDir: string): any {
    const manager = PlexConfigManager.create({
        storageDir,
        enableEvents: true,
        preloadCache: true
    });

    const adapter = new LegacyPlexAdapter(manager);
  
    // Initialize the adapter synchronously - this is critical for backward compatibility
    // The old implementation loads these values synchronously on startup
  
    // Load settings synchronously for backward compatibility
    let initialSettings: PlexSettings = {};
    try {
        const settingsPath = join(storageDir, 'plex.json');
        if (existsSync(settingsPath)) {
            const content = readFileSync(settingsPath, 'utf8');
            initialSettings = JSON.parse(content);
        }
    } catch (error) {
        console.error('Failed to load initial settings:', error);
    }
  
    // Load playlists synchronously for backward compatibility
    let initialPlaylists: PlexPlaylists = { data: [] };
    try {
        const playlistsPath = join(storageDir, 'playlists.json');
        if (existsSync(playlistsPath)) {
            const content = readFileSync(playlistsPath, 'utf8');
            initialPlaylists = JSON.parse(content);
        }
    } catch (error) {
        console.error('Failed to load initial playlists:', error);
    }
  
    // Set initial values
    adapter._settings = initialSettings;
    adapter._playlists = initialPlaylists;
  
    // Then initialize async updates in the background
    adapter.initializeCache().catch(console.error);

    // Return object matching the old interface
    return {
        get settings() {
            return adapter.settings;
        },
    
        get playlists() {
            return adapter.playlists;
        },
    
        saveConfig: (settings: PlexSettingsUpdate) => {
            adapter.saveConfig(settings);
        },
    
        savePlaylist: (type: string, id: string, plexId: string) => {
            adapter.savePlaylist(type, id, plexId);
        }
    };
}