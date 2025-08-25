import { getPlexUri, PlexSettings } from '@spotify-to-plex/plex-helpers';
import { plex } from '../../library/plex';

/**
 * Async wrapper for getUri - now requires settings to be passed
 */
export async function getUri(key: string, source?: string): Promise<string> {
    const settings = await plex.getSettings();
    if (!settings.uri || !settings.token || !settings.id) {
        throw new Error('Plex settings not configured properly');
    }

    return getPlexUri(settings as Required<typeof settings>, key, source);
}

/**
 * Version that accepts settings as parameter
 */
export function getUriWithSettings(settings: PlexSettings, key: string, source?: string): string {
    return getPlexUri(settings, key, source);
}