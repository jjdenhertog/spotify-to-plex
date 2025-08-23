import { PlexConfigManager, createLegacyPlex } from "@spotify-to-plex/plex-config";
import { settingsDir } from "./settingsDir";

// Re-export types that might be needed
export type { PlexPlaylists, PlexSettings, PlexConfigOptions } from "@spotify-to-plex/plex-config";

// Modern PlexConfigManager instance - use this for new code
export const plexConfigManager = PlexConfigManager.create({
    storageDir: settingsDir,
    enableEvents: true,
    preloadCache: true
});

// Initialize the manager for synchronous access
plexConfigManager.initialize().catch(console.error);

// Legacy plex instance for backward compatibility
// @deprecated Use plexConfigManager directly for new code
export const plex = createLegacyPlex(settingsDir);

// Helper functions for gradual migration
export const plexHelpers = {
  /**
   * Get the modern PlexConfigManager instance
   * Use this to gradually migrate away from the legacy plex object
   */
  getManager: () => plexConfigManager,
  
  /**
   * Initialize the manager if not already initialized
   * Call this before using synchronous methods if needed
   */
  ensureInitialized: async () => {
    await plexConfigManager.initialize();
  },
  
  /**
   * Migrate from legacy synchronous access to modern async access
   * Example: const settings = await plexHelpers.getSettings();
   */
  getSettings: () => plexConfigManager.getSettings(),
  getPlaylists: () => plexConfigManager.getPlaylists(),
  updateSettings: (settings: any) => plexConfigManager.updateSettings(settings),
  addPlaylist: (type: string, id: string, plexId: string) => plexConfigManager.addPlaylist(type, id, plexId)
};