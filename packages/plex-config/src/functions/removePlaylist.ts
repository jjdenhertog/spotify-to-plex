import { setState } from './state';
import { writeAtomicJSON } from './writeAtomicJSON';
import { getPlaylists } from './getPlaylists';

export async function removePlaylist(id: string): Promise<void> {
    const current = await getPlaylists();
    
    const updated = {
        data: (current.data || []).filter(playlist => playlist.id !== id)
    };
    
    await writeAtomicJSON('playlists.json', updated);
    setState({ playlistsCache: updated });
}