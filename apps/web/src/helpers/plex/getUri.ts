import { getPlexUri, PlexSettings } from '@spotify-to-plex/plex-helpers';
import { plex } from '@/library/plex';

/**
 * Legacy wrapper for getUri - maintains backward compatibility
 * @deprecated Use getPlexUri with explicit settings parameter instead
 */
export function getUri(key: string, source?: string): string {
    return getPlexUri(plex.settings, key, source);
}

/**
 * Modern version that accepts settings as parameter
 */
export function getUriWithSettings(settings: PlexSettings, key: string, source?: string): string {
    return getPlexUri(settings, key, source);
}
