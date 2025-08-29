import { PlexSettings } from '../types';
import { setState } from './state';
import { readJSON } from './readJSON';

export async function loadSettingsCache(): Promise<void> {
    const settings = await readJSON<PlexSettings>('plex.json') ?? {};
    setState({ settingsCache: settings });
}