import { setState } from './state';
import { deleteFile } from './deleteFile';

export async function clearSettings(): Promise<void> {
    await deleteFile('settings.json');
    setState({ settingsCache: null });
}