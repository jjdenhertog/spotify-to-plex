/**
 * MQTT Configuration
 * Load MQTT configuration from environment variables
 */

import { MQTTConfig } from './types';

export function loadMQTTConfig(): MQTTConfig {
    const brokerUrl = process.env.MQTT_BROKER_URL;
    if (!brokerUrl) 
        throw new Error('MQTT_BROKER_URL environment variable is required');

    return {
        brokerUrl,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        topicPrefix: process.env.MQTT_TOPIC_PREFIX || 'spotify_to_plex',
        discoveryPrefix: 'homeassistant',
    };
}
