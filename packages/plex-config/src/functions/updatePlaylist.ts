import { PlaylistItem } from '../types/PlaylistItem';
import { setState } from './state';
import { writeAtomicJSON } from './writeAtomicJSON';
import { getPlaylists } from './getPlaylists';

export async function updatePlaylist(id: string, updates: Partial<PlaylistItem>): Promise<void> {
    const current = await getPlaylists();
    
    const updated = {
        data: (current.data || []).map(playlist => 
            playlist.id === id 
                ? { ...playlist, ...updates }
                : playlist
        )
    };
    
    await writeAtomicJSON('playlists.json', updated);
    setState({ playlistsCache: updated });
}