import { PlexConfigManager } from '../core/plex-config-manager';
import { PlexSettings, PlexSettingsUpdate, PlexPlaylists } from '../types';

/**
 * Legacy adapter to provide backward compatibility with the old global plex object
 * This allows gradual migration from the old implementation
 */
export class LegacyPlexAdapter {
  private manager: PlexConfigManager;
  private _settings: PlexSettings = {};
  private _playlists: PlexPlaylists = { data: [] };

  constructor(manager: PlexConfigManager) {
    this.manager = manager;
    
    // Initialize cached values
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
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
  get settings(): PlexSettings {
    return this._settings;
  }

  get playlists(): PlexPlaylists {
    return this._playlists;
  }

  // Legacy methods
  saveConfig(settings: PlexSettingsUpdate): void {
    // Fire and forget for backward compatibility
    this.manager.updateSettings(settings)
      .then(updated => {
        this._settings = updated;
      })
      .catch(error => {
        console.error('Failed to save config:', error);
      });
  }

  savePlaylist(type: string, id: string, plexId: string): void {
    // Fire and forget for backward compatibility
    this.manager.addPlaylist(type, id, plexId)
      .then(() => {
        // Refresh cache
        return this.manager.getPlaylists();
      })
      .then(playlists => {
        this._playlists = playlists;
      })
      .catch(error => {
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