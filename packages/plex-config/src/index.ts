// Main exports
export { PlexConfigManager } from './core/plex-config-manager';
export type { PlexConfigOptions } from './core/plex-config-manager';
export { PlexEventEmitter } from './core/event-emitter';

// Services
export { SettingsService } from './services/settings-service';
export { PlaylistService } from './services/playlist-service';

// Storage
export type { StorageAdapter } from './storage/storage-adapter';
export { FileStorageAdapter } from './storage/file-storage-adapter';

// Types
export * from './types';

// Utils
export * from './utils/error-handler';

// Legacy migration support removed - use PlexConfigManager directly

// Convenience factory function
import { PlexConfigManager, PlexConfigOptions } from './core/plex-config-manager';

export function createPlexConfigManager(options: PlexConfigOptions): PlexConfigManager {
    return PlexConfigManager.create(options);
}