import { SavedItem } from '@spotify-to-plex/shared-types/spotify/SavedItem';
import { MQTTEntity } from './types';

/**
 * Build MQTT entity from SavedItem and Plex data
 */
export function buildEntity(savedItem: SavedItem, plexId: string, plexThumb: string): MQTTEntity {
    const category = savedItem.label || '';
    const categoryId = category.toLowerCase();

    // Determine icon based on type
    let icon = 'mdi:playlist-music';
    if (savedItem.type === 'spotify-album') {
        icon = 'mdi:album';
    } else if (savedItem.type === 'plex-media') {
        icon = 'mdi:music-box-multiple';
    }

    return {
        id: savedItem.id,
        category,
        category_id: categoryId,
        name: savedItem.title,
        media_content_id: `/library/metadata/${plexId}`,
        thumb: plexThumb,
        icon,
        friendly_name: savedItem.title,
    };
}
