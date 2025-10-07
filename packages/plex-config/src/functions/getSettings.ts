import { PlexSettings } from '../types/PlexSettings';
import { readJSON } from '../utils/fileUtils';

export async function getSettings(): Promise<PlexSettings> {
    const settings = await readJSON<PlexSettings>('plex.json');
    if (!settings) 
        return { id: '', uri: '', token: '' };
    
    return settings;
}