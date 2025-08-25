import getAPIUrl from '../getAPIUrl';
import { plex } from '../../library/plex';
import {
    storePlaylist as storePlaylistCore,
    PlexSettings
} from '@spotify-to-plex/plex-helpers';

/**
 * Convenience wrapper for storePlaylist
 */
export async function storePlaylist(name: string, uri: string): Promise<string> {
    const settings = await plex.getSettings();
    if (!settings.uri || !settings.token || !settings.id) {
        throw new Error('Plex settings not configured properly');
    }

    return storePlaylistCore(settings as Required<typeof settings>, getAPIUrl, name, uri);
}

/**
 * Version that accepts settings as parameter
 */
export async function storePlaylistWithSettings(
    settings: PlexSettings,
    name: string,
    uri: string
): Promise<string> {
    return storePlaylistCore(settings, getAPIUrl, name, uri);
}