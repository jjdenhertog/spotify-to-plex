import { LidarrSettings } from '../types/LidarrSettings';
import { readJSON } from '../utils/fileUtils';

const DEFAULT_SETTINGS: LidarrSettings = {
    enabled: false,
    url: '',
    root_folder_path: '',
    quality_profile_id: 1,
    metadata_profile_id: 1,
    auto_sync: false,
};

export async function getLidarrSettings() {
    const settings = await readJSON<LidarrSettings>('lidarr.json');

    if (!settings) {
        return DEFAULT_SETTINGS;
    }

    return settings;
}
