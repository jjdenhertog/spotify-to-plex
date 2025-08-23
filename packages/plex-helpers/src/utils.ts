import { PlexSettings, PlexConnectionError } from './types';

/**
 * Validates Plex settings and throws error if invalid
 */
export function validatePlexSettings(settings: PlexSettings): void {
  if (!settings.uri || !settings.token) {
    throw new PlexConnectionError('No Plex connection found - missing uri or token');
  }
}

/**
 * Creates a delay promise for retry mechanisms
 */
export function createDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates Plex URI for a given key and optional source
 */
export function getPlexUri(settings: PlexSettings, key: string, source?: string): string {
  validatePlexSettings(settings);
  
  if (source) {
    return `${source}${key}`;
  }

  return `server://${settings.id}/com.plexapp.plugins.library${key}`;
}