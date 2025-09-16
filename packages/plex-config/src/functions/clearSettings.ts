import { deleteJSON } from '../utils/fileUtils';

export async function clearSettings(): Promise<void> {
    await deleteJSON('plex.json');
}