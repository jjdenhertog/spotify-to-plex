import { PlexPlaylists } from '../types/PlexPlaylists';
import { readJSON } from '../utils/fileUtils';

export async function getPlaylists(): Promise<PlexPlaylists> {
    return await readJSON<PlexPlaylists>('playlists.json') ?? { data: [] };
}