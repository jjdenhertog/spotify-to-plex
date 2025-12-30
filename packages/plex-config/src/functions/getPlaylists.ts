import { PlexPlaylists } from '../types/PlexPlaylists';
import { readJSON } from '../utils/fileUtils';

export async function getPlaylists() {
    return await readJSON<PlexPlaylists>('playlists.json') ?? { data: [] };
}