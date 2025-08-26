// Main exports
export { PlexConfigManager } from './plex-config-manager.js';
export type { PlexConfigOptions } from './plex-config-manager.js';

// Music search integration
export { ExtendedPlexConfigManager } from './music-search-integration.js';
export type { ExtendedPlexConfigOptions } from './music-search-integration.js';

// All type definitions
export * from './types.js';

// Convenience factory function (maintains API compatibility)
import { PlexConfigManager, PlexConfigOptions } from './plex-config-manager.js';

export function createPlexConfigManager(options: PlexConfigOptions): PlexConfigManager {
    return PlexConfigManager.create(options);
}