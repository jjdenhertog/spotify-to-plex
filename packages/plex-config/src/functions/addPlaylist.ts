import { setState } from './state';
import { writeAtomicJSON } from './writeAtomicJSON';
import { getPlaylists } from './getPlaylists';

export async function addPlaylist(type: string, id: string, plexId: string): Promise<void> {
    const current = await getPlaylists();
    const newPlaylist = { type, id, plex: plexId };
    
    const updated = {
        data: [...(current.data || []), newPlaylist]
    };
    
    await writeAtomicJSON('playlists.json', updated);
    setState({ playlistsCache: updated });
}