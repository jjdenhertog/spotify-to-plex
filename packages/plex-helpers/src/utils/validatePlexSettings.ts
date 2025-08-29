import { PlexSettings, PlexConnectionError } from '../types';

export function validatePlexSettings(settings: PlexSettings): void {
    if (!settings.uri || !settings.token) {
        throw new PlexConnectionError('No Plex connection found - missing uri or token');
    }
}