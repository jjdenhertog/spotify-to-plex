/**
 * Integration between PlexConfigManager and MusicSearchConfigManager
 * Provides unified configuration access point
 */

import { PlexConfigManager } from './plex-config-manager';
import { MusicSearchConfigManager } from '@spotify-to-plex/music-search';
import { PlexConfigOptions } from './types';

export interface ExtendedPlexConfigOptions extends PlexConfigOptions {
  enableMusicSearchConfig?: boolean;
}

export class ExtendedPlexConfigManager extends PlexConfigManager {
  private musicSearchConfigManager: MusicSearchConfigManager | null = null;
  private readonly enableMusicSearch: boolean;

  public constructor(options: ExtendedPlexConfigOptions) {
    super(options);
    this.enableMusicSearch = options.enableMusicSearchConfig ?? true;
    
    if (this.enableMusicSearch) {
      this.musicSearchConfigManager = MusicSearchConfigManager.create({
        storageDir: options.storageDir,
        preloadCache: options.preloadCache
      });
    }
  }

  // Static factory method
  public static create(options: ExtendedPlexConfigOptions): ExtendedPlexConfigManager {
    return new ExtendedPlexConfigManager(options);
  }

  /**
   * Get music search configuration manager
   * Throws if music search integration is disabled
   */
  public getMusicSearchConfig(): MusicSearchConfigManager {
    if (!this.musicSearchConfigManager) {
      throw new Error('Music search configuration is disabled. Enable with enableMusicSearchConfig: true');
    }
    return this.musicSearchConfigManager;
  }

  /**
   * Check if music search configuration is enabled
   */
  public hasMusicSearchConfig(): boolean {
    return this.enableMusicSearch && this.musicSearchConfigManager !== null;
  }

  /**
   * Initialize both plex and music search configurations
   */
  public async initialize(): Promise<void> {
    await super.initialize();
    
    if (this.musicSearchConfigManager) {
      await this.musicSearchConfigManager.initialize();
    }
  }

  /**
   * Clear all configurations (plex settings, playlists, and music search)
   */
  public async clearAllConfigurations(): Promise<void> {
    await Promise.all([
      super.clearSettings(),
      super.clearPlaylists(),
      this.musicSearchConfigManager?.clearConfig() ?? Promise.resolve()
    ]);
  }
}