import { PlexConfigManager } from "@spotify-to-plex/plex-config";
import { settingsDir } from "./settingsDir";

// Re-export types that might be needed
export type { PlexPlaylists, PlexSettings, PlexConfigOptions } from "@spotify-to-plex/plex-config";

// PlexConfigManager instance - this is the new approach
export const plexConfigManager = PlexConfigManager.create({
    storageDir: settingsDir,
    preloadCache: true
});

// Initialize the manager
// eslint-disable-next-line unicorn/prefer-top-level-await, no-console
plexConfigManager.initialize().catch(console.error);

// Export the manager directly as plex for easier migration
export const plex = plexConfigManager;