import { createPlexConfig } from "@spotify-to-plex/plex-config/functions/createPlexConfig";
import { getSettings } from "@spotify-to-plex/plex-config/functions/getSettings";
import { updateSettings } from "@spotify-to-plex/plex-config/functions/updateSettings";
import { hasValidConnection } from "@spotify-to-plex/plex-config/functions/hasValidConnection";
import { clearSettings } from "@spotify-to-plex/plex-config/functions/clearSettings";
import { getPlaylists } from "@spotify-to-plex/plex-config/functions/getPlaylists";
import { addPlaylist } from "@spotify-to-plex/plex-config/functions/addPlaylist";
import { removePlaylist } from "@spotify-to-plex/plex-config/functions/removePlaylist";
import { updatePlaylist } from "@spotify-to-plex/plex-config/functions/updatePlaylist";
import { clearPlaylists } from "@spotify-to-plex/plex-config/functions/clearPlaylists";
import { settingsDir } from "@spotify-to-plex/shared-utils/server";

// Re-export types that might be needed
export type { PlexPlaylists, PlexSettings, PlexConfigOptions } from "@spotify-to-plex/plex-config/types";

// Initialize the plex configuration
// eslint-disable-next-line unicorn/prefer-top-level-await, no-console
createPlexConfig({
    storageDir: settingsDir,
    preloadCache: true
}).catch(console.error);

// Export functions as plex object for easier migration
export const plex = {
    getSettings,
    updateSettings,
    hasValidConnection,
    clearSettings,
    getPlaylists,
    addPlaylist,
    removePlaylist,
    updatePlaylist,
    clearPlaylists
};