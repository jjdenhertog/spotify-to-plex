import { PlexSettings } from '../PlexSettings';
import { PlexConnectionError } from '../PlexConnectionError';

export function validatePlexSettings(settings: PlexSettings) {
    if (!settings.uri || !settings.token) {
        throw new PlexConnectionError('No Plex connection found - missing uri or token');
    }
}