import { settingsDir } from "@/library/settingsDir";
import { createLegacyPlex } from '@vibe-kanban/plex-config';

// Re-export types for backward compatibility
export type { PlexSettings, PlexPlaylists } from '@vibe-kanban/plex-config';

// Create the plex instance using the new implementation with legacy adapter
export const plex = createLegacyPlex(settingsDir);