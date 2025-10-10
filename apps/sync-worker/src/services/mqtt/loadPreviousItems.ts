import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { PublishedItem } from './types';

/**
 * Load previously published items
 */
export function loadPreviousItems(): PublishedItem[] {
    const storageDir = getStorageDir();
    const publishedItemsPath = join(storageDir, 'mqtt_published_items.json');

    if (!existsSync(publishedItemsPath)) {
        console.log('[MQTT] No previous published items found');

        return [];
    }

    try {
        const content = readFileSync(publishedItemsPath, 'utf8');
        const parsed = JSON.parse(content);

        // Handle old format (array of strings) vs new format (array of objects)
        if (Array.isArray(parsed)) {
            // Check if it's an array of strings (old format)
            if (parsed.length > 0 && typeof parsed[0] === 'string') {
                // Convert old format to new format
                return parsed.map(id => ({
                    id,
                    entity_id: `sensor.spotify_to_plex_item_${id.toLowerCase().replace(/[^\da-z]/g, '')}`,
                    category: '',
                }));
            }
            
            // Already new format
            return parsed as PublishedItem[];
        }

        return [];
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[MQTT] Failed to load previous items: ${message}`);

        return [];
    }
}
