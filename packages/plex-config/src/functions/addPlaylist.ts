import { PlaylistItem } from '../types/PlaylistItem';
import { getPlaylists } from './getPlaylists';
import { writeJSON } from '../utils/fileUtils';

export async function addPlaylist(playlist: PlaylistItem): Promise<void> {
    const playlists = await getPlaylists();
    const updated = {
        data: [...(playlists.data || []), playlist]
    };

    await writeJSON('playlists.json', updated);
}