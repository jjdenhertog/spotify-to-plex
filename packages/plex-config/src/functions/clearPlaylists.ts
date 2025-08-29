import { setState } from './state';
import { deleteFile } from './deleteFile';

export async function clearPlaylists(): Promise<void> {
    await deleteFile('playlists.json');
    setState({ playlistsCache: null });
}