/**
 * MQTT Configuration
 * Load MQTT configuration from environment variables
 */

import { MQTTConfig } from './types';

export function loadMQTTConfig(): MQTTConfig {
    const brokerUrl = process.env.MQTT_BROKER_URL?.trim();
    if (!brokerUrl)
        throw new Error('MQTT_BROKER_URL environment variable is required');

    return {
        brokerUrl,
        username: process.env.MQTT_USERNAME?.trim() || undefined,
        password: process.env.MQTT_PASSWORD?.trim() || undefined,
        topicPrefix: process.env.MQTT_TOPIC_PREFIX?.trim() || 'spotify_to_plex',
        discoveryPrefix: 'homeassistant',
    };
}
