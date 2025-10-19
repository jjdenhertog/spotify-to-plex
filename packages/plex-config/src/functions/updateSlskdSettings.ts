import { SlskdSettings } from '../types/SlskdSettings';
import { getSlskdSettings } from './getSlskdSettings';
import { writeJSON } from '../utils/fileUtils';

export async function updateSlskdSettings(
    updates: Partial<SlskdSettings>
): Promise<SlskdSettings> {
    const current = await getSlskdSettings();
    const updated = { ...current, ...updates };

    await writeJSON('slskd.json', updated);

    return updated;
}
