import { settingsDir } from '@spotify-to-plex/shared-utils/utils/settingsDir';
import { plex } from '../library/plex';
import { MQTTItem } from '@spotify-to-plex/shared-types/dashboard/MQTTItem';
import { PlaylistData } from '@spotify-to-plex/shared-types/dashboard/PlaylistData';
import { TrackLink } from '@spotify-to-plex/shared-types/common/track';
import { getById } from '@spotify-to-plex/plex-music-search/functions/getById';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/config/config-utils";
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mqttHelpers } from '../helpers/mqttHelpers';
import { savedItemsHelpers } from '../helpers/savedItemsHelpers';

export type MQTTRefreshOptions = {
    force?: boolean;
    skipValidation?: boolean;
}

export async function refreshMQTT(options: MQTTRefreshOptions = {}) {
    const mqtt = mqttHelpers();
    await mqtt.open();

    const { items: savedItems } = savedItemsHelpers();
    if (savedItems.length === 0 && !options.skipValidation) {
        throw new Error('Missing spotify saved items');
    }

    const playlistPath = join(settingsDir, 'playlists.json');
    if (!existsSync(playlistPath) && !options.skipValidation) {
        throw new Error('Missing playlists');
    }

    const trackLinksPath = join(settingsDir, 'track_links.json');
    if (!existsSync(trackLinksPath) && !options.skipValidation) {
        throw new Error('Track links missing');
    }

    const settings = await plex.getSettings();
    if ((!settings.token || !settings.uri) && !options.skipValidation) {
        throw new Error('Missing plex');
    }

    // Handle missing files gracefully when not in strict mode
    const playlists: PlaylistData = existsSync(playlistPath)
        ? JSON.parse(readFileSync(playlistPath, 'utf8'))
        : { data: [] };
    const trackLinks: TrackLink[] = existsSync(trackLinksPath)
        ? JSON.parse(readFileSync(trackLinksPath, 'utf8'))
        : [];

    const categories: string[] = [];
    const items: MQTTItem[] = [];

    for (let i = 0; i < savedItems.length; i++) {
        const savedItem = savedItems[i];
        if (!savedItem)
            continue;

        const { type, id, title, label, uri } = savedItem;
        if (!label || !title || !uri) {
            continue;
        }

        if (!categories.includes(label)) {
            categories.push(label);
        }

        const entityId = id.slice(Math.max(0, id.lastIndexOf('/') + 1));
        
        // Load music search configuration
        let musicSearchConfig;
        try {
            musicSearchConfig = await getMusicSearchConfig(settingsDir);
        } catch (error) {
            // Fallback to default config if error loading
            console.warn('Failed to load music search config, using defaults:', error);
        }

        let item: { id: string; category: string; name: string; media_content_id: string } | null = null;

        switch (type) {
            case 'plex-media': {
                const mediaContentId = uri
                    .split('/playlist')
                    .join('')
                    .split('/children')
                    .join('')
                    .split('/items')
                    .join('');

                item = { id: entityId, category: label, name: title, media_content_id: mediaContentId };

                break;
            }
            case 'spotify-album': {
                // Skip if theres not track link
                const trackLink = trackLinks.find(item => item.spotify_id === id);
                if (!trackLink?.plex_id || trackLink.plex_id.length === 0) {
                    continue;
                }

                const plexId = trackLink.plex_id?.[0];
                if (!plexId) {
                    continue;
                }

                item = { id: entityId, category: label, name: title, media_content_id: plexId };

                break;
            }
            case 'spotify-playlist': {
                // Skip if theres not track link
                const playlist = playlists.data.find(item => item.id === id);
                if (!playlist?.plex) {
                    continue;
                }

                item = { id: entityId, category: label, name: title, media_content_id: `/library/metadata/${playlist.plex}` };
                break;
            }
        }

        if (!item) {
            continue;
        }

        try {
            const mediaContentId = item.media_content_id;
            const data = await getById({
                uri: settings.uri || '',
                token: settings.token || '',
                musicSearchConfig,
            }, mediaContentId);
            if (data) {
                const { image } = data;

                // Publish MQTT
                const mqttItem: MQTTItem = {
                    ...item,
                    thumb: image || ''
                };

                items.push(mqttItem);
                await mqtt.publishItem(mqttItem);
            }
        } catch (_e) {
            // Error ignored
        }
    }

    // Update categories
    await mqtt.publishCategories(categories);
    await mqtt.removeUnusedItems(items);

    await mqtt.close();
}


function run() {
    if (typeof process.env.MQTT_BROKER_URL !== 'string' || typeof process.env.MQTT_USERNAME !== 'string' || typeof process.env.MQTT_PASSWORD !== 'string') {
        return;
    }

    console.log('-- Publishing MQTT Items, for use with Home Assistant --');
    refreshMQTT()
        .then(() => {
            console.log('Publish MQTT items completed');
        })
        .catch((_e: unknown) => {
            // Do nothing
        });
}

run();