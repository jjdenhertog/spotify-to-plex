import { SlskdSettings } from '../types/SlskdSettings';
import { readJSON } from '../utils/fileUtils';

const DEFAULT_SETTINGS: SlskdSettings = {
    enabled: false,
    url: '',
    allowed_extensions: ['flac', 'mp3', 'wav', 'ogg', 'm4a'],
    min_bitrate: 320,
    min_bitdepth: 16,
    // max_length_difference: 10, // TODO: Re-enable when Track type includes duration_ms
    retry_limit: 5,
    search_timeout: 20,
    download_attempts: 3,
    auto_sync: false,
};

export async function getSlskdSettings(): Promise<SlskdSettings> {
    const settings = await readJSON<SlskdSettings>('slskd.json');

    if (!settings) {
        return DEFAULT_SETTINGS;
    }

    return settings;
}
