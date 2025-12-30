import { LidarrSettings } from '../types/LidarrSettings';
import { getLidarrSettings } from './getLidarrSettings';
import { writeJSON } from '../utils/fileUtils';

export async function updateLidarrSettings(
    updates: Partial<LidarrSettings>
) {
    const current = await getLidarrSettings();
    const updated = { ...current, ...updates };

    await writeJSON('lidarr.json', updated);

    return updated;
}
