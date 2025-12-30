import { PlexSettings } from '../PlexSettings';
import { validatePlexSettings } from './validatePlexSettings';

export function getPlexUri(settings: PlexSettings, key: string, source?: string) {
    validatePlexSettings(settings);
    
    if (source) {
        return `${source}${key}`;
    }

    return `server://${settings.id}/com.plexapp.plugins.library${key}`;
}