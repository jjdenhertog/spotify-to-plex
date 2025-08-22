import { settingsDir } from '../library/settingsDir';
import { MQTTItem } from '../types/dashboard/MQTTItem';
import mqtt, { MqttClient } from 'mqtt';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function mqttHelpers() {

    const publishedItemsPath = join(settingsDir, 'mqtt_published_items.json');
    const categoryTopic = `spotify-to-plex/categories`;
    const itemTopicBase = `spotify-to-plex/items`;

    let client: MqttClient | null = null;

    const publishData = async (topic: string, payload: object, retain = false) => {
        const payloadString = JSON.stringify(payload);
        await client?.publishAsync(topic, payloadString, { retain });
    };

    const publishCategoryDiscovery = async () => {
        const discoveryTopic = `homeassistant/sensor/categories/config`;
        const payload = {
            name: "Music Categories",
            unique_id: "spotify_to_plex_categories",
            object_id: "spotify_to_plex_categories",
            state_topic: categoryTopic,
            value_template: "{{ value_json.categories | join(',') }}",
            icon: "mdi:music"
        };

        await publishData(discoveryTopic, payload, true);
    };

    const publishItemDiscovery = async (item: MQTTItem) => {
        const discoveryTopic = `homeassistant/sensor/item_${item.id}/config`;
        const payload = {
            name: item.name,
            unique_id: `spotify_to_plex_item_${item.id}`,
            object_id: `spotify_to_plex_item_${item.id}`,
            state_topic: `${itemTopicBase}/${item.id}`,
            json_attributes_topic: `${itemTopicBase}/${item.id}`,
            value_template: "{{ value_json.name }}",
            icon: "mdi:playlist-music"
        };
        await publishData(discoveryTopic, payload, true);
    };


    const publishCategories = async (categories: string[]) => {
        await publishCategoryDiscovery()
        await publishData(categoryTopic, { categories }, true);
    }

    const publishItem = async (item: MQTTItem) => {
        const data = {
            ...item,
            category_id: item.category.toLowerCase().trim()
        }
        await publishItemDiscovery(data)

        const topic = `${itemTopicBase}/${data.id}`;
        await publishData(topic, data, true);
    }

    const removeUnusedItems = async (all: MQTTItem[]) => {
        if (!client)
            return;

        const itemIds = all.map(item => item.id)
        if (existsSync(publishedItemsPath)) {
            const previousItems: string[] = JSON.parse(readFileSync(publishedItemsPath, 'utf8'))
            const toRemoveItems = previousItems.filter(prev => !itemIds.includes(prev))
            if (toRemoveItems.length > 0) {
                for (let i = 0; i < toRemoveItems.length; i++) {
                    const remove = toRemoveItems[i];
                    const topic = `homeassistant/sensor/item_${remove}/config`;
                    if (client)
                        await client.publishAsync(topic, "", { retain: true });
                }
            }
        }

        writeFileSync(publishedItemsPath, JSON.stringify(itemIds, undefined, 4))
    }

    const open = async () => {
        if (typeof process.env.MQTT_BROKER_URL != 'string' || typeof process.env.MQTT_USERNAME != 'string' || typeof process.env.MQTT_PASSWORD != 'string')
            return;

        client = await mqtt.connectAsync(process.env.MQTT_BROKER_URL, {
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
        });
    }
    const close = async () => {
        await client?.endAsync()
    }

    return { publishCategories, publishItem, removeUnusedItems, close, open }
}