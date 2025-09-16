import { PlexSettings } from '../types/PlexSettings';
import { readJSON } from '../utils/fileUtils';

export async function getSettings(): Promise<PlexSettings> {
    return await readJSON<PlexSettings>('plex.json') ?? {};
}