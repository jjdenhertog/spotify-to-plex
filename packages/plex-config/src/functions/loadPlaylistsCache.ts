import { PlexPlaylists } from '../types/PlexPlaylists';
import { setState } from './state';
import { readJSON } from './readJSON';

export async function loadPlaylistsCache(): Promise<void> {
    const playlists = await readJSON<PlexPlaylists>('playlists.json') ?? { data: [] };
    setState({ playlistsCache: playlists });
}