import { PlexPlaylists } from '../types/PlexPlaylists';
import { getState } from './state';
import { readJSON } from './readJSON';

export async function getPlaylists(): Promise<PlexPlaylists> {
    const state = getState();
    
    if (state.playlistsCache) {
        return state.playlistsCache;
    }
    
    const playlists = await readJSON<PlexPlaylists>('playlists.json');
    
    return playlists || { data: [] };
}