import { PlaylistItem } from '../types/PlaylistItem';
import { getPlaylists } from './getPlaylists';
import { writeJSON } from '../utils/fileUtils';

export async function addPlaylist(playlist: PlaylistItem): Promise<void> {
    const playlists = await getPlaylists();
    const { data = [] } = playlists;

    const filtered = data.filter(item => item.id !== playlist.id);
    const updated = {
        data: [...filtered, playlist]
    };

    await writeJSON('playlists.json', updated);
}