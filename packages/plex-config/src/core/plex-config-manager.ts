import { StorageAdapter } from '../storage/storage-adapter';
import { FileStorageAdapter } from '../storage/file-storage-adapter';
import { SettingsService } from '../services/settings-service';
import { PlaylistService } from '../services/playlist-service';
import { PlexEventEmitter } from './event-emitter';
import { 
  PlexSettings, 
  PlexSettingsUpdate,
  PlexPlaylists,
  PlaylistUpdate,
  PlexConfigEvent
} from '../types';

export type PlexConfigOptions = {
  storageDir: string;
  enableEvents?: boolean;
  enableCache?: boolean;
  preloadCache?: boolean;
}

export class PlexConfigManager {
  private readonly settingsService: SettingsService;
  private readonly playlistService: PlaylistService;
  private readonly eventEmitter: PlexEventEmitter;
  private readonly storage: StorageAdapter;
  private initialized = false;

  public constructor(
    storage?: StorageAdapter,
    eventEmitter?: PlexEventEmitter
  ) {
    this.storage = storage ?? new FileStorageAdapter('./settings');
    this.eventEmitter = eventEmitter ?? new PlexEventEmitter();
    this.settingsService = new SettingsService(this.storage, this.eventEmitter);
    this.playlistService = new PlaylistService(this.storage, this.eventEmitter);
  }

  // Static factory method for convenience
  public static create(options: PlexConfigOptions): PlexConfigManager {
    const storage = new FileStorageAdapter(options.storageDir);
    const eventEmitter = options.enableEvents === false ? new PlexEventEmitter() : new PlexEventEmitter();
    const manager = new PlexConfigManager(storage, eventEmitter);
    
    if (options.preloadCache) {
      manager.initialize().catch(console.error);
    }
    
    return manager;
  }

  // Initialize and preload cache for synchronous access
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await Promise.all([
      this.settingsService.preloadCache(),
      this.playlistService.preloadCache()
    ]);
    
    this.initialized = true;
  }

  // Settings methods
  public async getSettings(): Promise<PlexSettings> {
    return this.settingsService.getSettings();
  }

  public async updateSettings(settings: PlexSettingsUpdate): Promise<PlexSettings> {
    return this.settingsService.updateSettings(settings);
  }

  public async saveConfig(settings: PlexSettingsUpdate): Promise<PlexSettings> {
    // Alias for backward compatibility
    return this.updateSettings(settings);
  }

  public async hasValidConnection(): Promise<boolean> {
    return this.settingsService.hasValidConnection();
  }

  public async clearSettings(): Promise<void> {
    return this.settingsService.clearSettings();
  }

  // Playlist methods
  public async getPlaylists(): Promise<PlexPlaylists> {
    return this.playlistService.getPlaylists();
  }

  public async addPlaylist(type: string, id: string, plexId: string): Promise<void> {
    return this.playlistService.addPlaylist({ type, id, plex: plexId });
  }

  public async savePlaylist(type: string, id: string, plexId: string): Promise<void> {
    // Alias for backward compatibility
    return this.addPlaylist(type, id, plexId);
  }

  public async removePlaylist(id: string): Promise<void> {
    return this.playlistService.removePlaylist(id);
  }

  public async updatePlaylist(id: string, updates: Partial<PlaylistUpdate>): Promise<void> {
    return this.playlistService.updatePlaylist(id, updates);
  }

  public async clearPlaylists(): Promise<void> {
    return this.playlistService.clearPlaylists();
  }

  // Synchronous methods for backward compatibility (requires initialization)
  public get settings(): PlexSettings {
    if (!this.initialized) {
      console.warn('PlexConfigManager not initialized. Call initialize() for synchronous access.');
    }

    return this.settingsService.getCachedSettings();
  }

  public get playlists(): PlexPlaylists {
    if (!this.initialized) {
      console.warn('PlexConfigManager not initialized. Call initialize() for synchronous access.');
    }

    return this.playlistService.getCachedPlaylists();
  }

  // Event subscription
  public on<T extends PlexConfigEvent>(
    type: T['type'], 
    listener: (event: T) => void
  ): void {
    this.eventEmitter.on(type, listener);
  }

  public off<T extends PlexConfigEvent>(
    type: T['type'], 
    listener: (event: T) => void
  ): void {
    this.eventEmitter.off(type, listener);
  }

  public once<T extends PlexConfigEvent>(
    type: T['type'],
    listener: (event: T) => void
  ): void {
    const wrapper = (event: T) => {
      this.off(type, wrapper);
      listener(event);
    };
    this.on(type, wrapper);
  }

  // Cleanup
  public async dispose(): Promise<void> {
    this.eventEmitter.removeAllListeners();
  }
}