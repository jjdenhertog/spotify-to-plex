import { configDir } from '@/library/configDir';
import { MQTTItem } from '@/types/dashboard/DashboardItem';
import mqtt, { MqttClient } from 'mqtt';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function useMQTT() {

    const publishedItemsPath = join(configDir, 'mqtt_published_items.json');
    const categoryTopic = `spotify-to-plex/categories`;
    const itemTopicBase = `spotify-to-plex/items`;

    let client: MqttClient | null = null;
    if (typeof process.env.MQTT_BROKER_URL == 'string' && typeof process.env.MQTT_USERNAME == 'string' && typeof process.env.MQTT_PASSWORD == 'string') {
        client = mqtt.connect(process.env.MQTT_BROKER_URL, {
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
        });
    }

    const publishData = (topic: string, payload: object, retain = false) => {
        if (!client)
            return;

        const payloadString = JSON.stringify(payload);
        client.publish(topic, payloadString, { retain });
    };

    const publishCategoryDiscovery = () => {
        const discoveryTopic = `homeassistant/sensor/categories/config`;
        const payload = {
            name: "Music Categories",
            unique_id: "spotify_to_plex_categories",
            object_id: "spotify_to_plex_categories",
            state_topic: categoryTopic,
            value_template: "{{ value_json.categories | join(',') }}",
            icon: "mdi:music",
        };

        publishData(discoveryTopic, payload, true);
    };

    const publishItemDiscovery = (item: MQTTItem) => {
        const discoveryTopic = `homeassistant/sensor/item_${item.id}/config`;
        const payload = {
            name: item.name,
            unique_id: `spotify_to_plex_item_${item.id}`,
            object_id: `spotify_to_plex_item_${item.id}`,
            state_topic: `${itemTopicBase}/${item.id}`,
            json_attributes_topic: `${itemTopicBase}/${item.id}`,
            value_template: "{{ value_json.name }}",
            icon: "mdi:playlist-music",
        };
        publishData(discoveryTopic, payload);
    };


    const publishCategories = (categories: string[]) => {
        publishCategoryDiscovery()
        publishData(categoryTopic, { categories }, true);
    }

    const publishItem = (item: MQTTItem) => {
        const data = {
            ...item,
            category_id: item.category.toLowerCase().trim()
        }
        publishItemDiscovery(data)

        const topic = `${itemTopicBase}/${data.id}`;
        publishData(topic, data, true);
    }

    const removeUnusedItems = (all: MQTTItem[]) => {

        if (!client)
            return;

        const itemIds = all.map(item => item.id)
        if (existsSync(publishedItemsPath)) {
            const previousItems: string[] = JSON.parse(readFileSync(publishedItemsPath, 'utf8'))
            const toRemoveItems = previousItems.filter(prev => !itemIds.includes(prev))
            if (toRemoveItems.length > 0) {
                toRemoveItems.forEach(remove => {
                    const topic = `homeassistant/sensor/item_${remove}/config`;
                    client.publish(topic, "", { retain: true });
                })
            }
        }

        writeFileSync(publishedItemsPath, JSON.stringify(itemIds, undefined, 4))
    }

    return { publishCategories, publishItem, removeUnusedItems }
}
