import { PlaylistItem } from '../types/PlaylistItem';
import { getPlaylists } from './getPlaylists';
import { writeJSON } from '../utils/fileUtils';

export async function updatePlaylist(id: string, updates: Partial<PlaylistItem>) {
    const playlists = await getPlaylists();
    const updated = {
        data: (playlists.data || []).map(item =>
            item.id === id ? { ...item, ...updates } : item
        )
    };

    await writeJSON('playlists.json', updated);
}