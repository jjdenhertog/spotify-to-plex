import { deleteJSON } from '../utils/fileUtils';

export async function clearPlaylists(): Promise<void> {
    await deleteJSON('playlists.json');
}