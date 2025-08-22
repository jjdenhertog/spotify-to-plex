import { plex } from '@/library/plex';


export function getUri(key: string, source?: string) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    if (source)
        return `${source}${key}`;

    return `server://${plex.settings.id}/com.plexapp.plugins.library${key}`;
}
