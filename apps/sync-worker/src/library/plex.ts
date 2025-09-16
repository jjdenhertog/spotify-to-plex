import { getSettings } from "@spotify-to-plex/plex-config/functions/getSettings";
import { updateSettings } from "@spotify-to-plex/plex-config/functions/updateSettings";
import { hasValidConnection } from "@spotify-to-plex/plex-config/functions/hasValidConnection";
import { clearSettings } from "@spotify-to-plex/plex-config/functions/clearSettings";
import { getPlaylists } from "@spotify-to-plex/plex-config/functions/getPlaylists";
import { addPlaylist } from "@spotify-to-plex/plex-config/functions/addPlaylist";
import { removePlaylist } from "@spotify-to-plex/plex-config/functions/removePlaylist";
import { updatePlaylist } from "@spotify-to-plex/plex-config/functions/updatePlaylist";
import { clearPlaylists } from "@spotify-to-plex/plex-config/functions/clearPlaylists";

// Types are imported where needed, not re-exported

// No initialization needed - the plex-config package handles this automatically

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