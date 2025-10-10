import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { PublishedItem } from './types';

/**
 * Save currently published items
 */
export function savePublishedItems(items: PublishedItem[]): void {
    const storageDir = getStorageDir();
    const publishedItemsPath = join(storageDir, 'mqtt_published_items.json');

    try {
        writeFileSync(
            publishedItemsPath,
            JSON.stringify(items, null, 2),
            'utf8'
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[MQTT] Failed to save published items: ${message}`);
    }
}
