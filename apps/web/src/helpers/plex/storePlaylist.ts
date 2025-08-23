import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import {
    storePlaylist as storePlaylistCore,
    PlexSettings
} from '@spotify-to-plex/plex-helpers';

/**
 * Legacy wrapper for storePlaylist - maintains backward compatibility
 * @deprecated Use storePlaylistWithSettings instead
 */
export async function storePlaylist(name: string, uri: string): Promise<string> {
    return storePlaylistCore(plex.settings, getAPIUrl, name, uri);
}

/**
 * Modern version that accepts settings as parameter
 */
export async function storePlaylistWithSettings(
    settings: PlexSettings,
    name: string,
    uri: string
): Promise<string> {
    return storePlaylistCore(settings, getAPIUrl, name, uri);
}