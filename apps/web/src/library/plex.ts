import { addPlaylist } from "@spotify-to-plex/plex-config/functions/addPlaylist";
import { clearPlaylists } from "@spotify-to-plex/plex-config/functions/clearPlaylists";
import { clearSettings } from "@spotify-to-plex/plex-config/functions/clearSettings";
/* eslint-disable unicorn/prefer-top-level-await */
import { createPlexConfig } from "@spotify-to-plex/plex-config/functions/createPlexConfig";
import { getPlaylists } from "@spotify-to-plex/plex-config/functions/getPlaylists";
import { getSettings } from "@spotify-to-plex/plex-config/functions/getSettings";
import { hasValidConnection } from "@spotify-to-plex/plex-config/functions/hasValidConnection";
import { removePlaylist } from "@spotify-to-plex/plex-config/functions/removePlaylist";
import { updatePlaylist } from "@spotify-to-plex/plex-config/functions/updatePlaylist";
import { updateSettings } from "@spotify-to-plex/plex-config/functions/updateSettings";
import { settingsDir } from "@spotify-to-plex/shared-utils/utils/settingsDir";

// Re-export types that might be needed
export type { PlexPlaylists } from "@spotify-to-plex/plex-config/types/PlexPlaylists";
export type { PlexSettings } from "@spotify-to-plex/plex-config/types/PlexSettings";
export type { PlexConfigOptions } from "@spotify-to-plex/plex-config/types/PlexConfigOptions";

// Initialize the plex configuration
// eslint-disable-next-line unicorn/prefer-top-level-await, no-console
createPlexConfig({
    storageDir: settingsDir,
    preloadCache: true
}).catch((error: unknown) => console.error(error));

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