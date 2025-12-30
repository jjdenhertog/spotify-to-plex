/**
 * Create discovery config for categories entity
 */
export function createCategoriesDiscoveryConfig(topicPrefix: string) {
    const entityId = `${topicPrefix}_categories`;
    const stateTopic = `${topicPrefix}/categories/state`;

    return {
        name: 'Music Categories',
        unique_id: entityId,
        state_topic: stateTopic,
        value_template: '{{ value }}',
        json_attributes_topic: stateTopic,
        icon: 'mdi:music',
        device: {
            identifiers: [topicPrefix],
            name: 'Spotify to Plex',
            manufacturer: 'Custom',
            model: 'MQTT Bridge',
        },
    };
}
