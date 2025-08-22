import { createLegacyPlex } from "@spotify-to-plex/plex-config";
import { settingsDir } from "./settingsDir";

// Create plex instance using the legacy adapter for backward compatibility
export const plex = createLegacyPlex(settingsDir);

// Re-export types that might be needed
export type { PlexPlaylists } from "@spotify-to-plex/plex-config";