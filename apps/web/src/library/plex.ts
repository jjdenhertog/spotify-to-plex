import { settingsDir } from "@/library/settingsDir";
import { PlexConfigManager } from '@spotify-to-plex/plex-config';

// Re-export types
export type { PlexSettings, PlexPlaylists, PlexConfigOptions } from '@spotify-to-plex/plex-config';

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