import { SlskdSettings } from '../types/SlskdSettings';
import { readJSON } from '../utils/fileUtils';

const DEFAULT_SETTINGS: SlskdSettings = {
    enabled: false,
    url: '',
    allowed_extensions: ['flac', 'mp3'],
    search_timeout: 5,
    max_results: 30,
    download_attempts: 3,
    auto_sync: false,
};

export async function getSlskdSettings() {
    const settings = await readJSON<SlskdSettings>('slskd.json');

    if (!settings) {
        return DEFAULT_SETTINGS;
    }

    return settings;
}
