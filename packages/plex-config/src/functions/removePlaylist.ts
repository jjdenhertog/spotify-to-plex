import { getPlaylists } from './getPlaylists';
import { writeJSON } from '../utils/fileUtils';

export async function removePlaylist(id: string): Promise<void> {
    const playlists = await getPlaylists();
    const updated = {
        data: (playlists.data || []).filter(item => item.id !== id)
    };

    await writeJSON('playlists.json', updated);
}