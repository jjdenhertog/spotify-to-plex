import { MQTTEntity, HomeAssistantDiscoveryConfig } from './types';

/**
 * Create Home Assistant Discovery config
 */
export function createDiscoveryConfig(entity: MQTTEntity, topicPrefix: string): HomeAssistantDiscoveryConfig {
    const stateTopic = `${topicPrefix}/items/${entity.id}/state`;
    const uniqueId = `${topicPrefix}_item_${entity.id}`;

    return {
        name: entity.friendly_name,
        unique_id: uniqueId,
        state_topic: stateTopic,
        value_template: '{{ value_json.name }}',
        json_attributes_topic: stateTopic,
        icon: entity.icon,
        device: {
            identifiers: [topicPrefix],
            name: 'Spotify to Plex',
            manufacturer: 'Custom',
            model: 'MQTT Bridge',
        },
    };
}
