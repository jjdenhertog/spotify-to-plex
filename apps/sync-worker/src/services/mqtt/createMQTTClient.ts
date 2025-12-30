/**
 * MQTT Client
 * MQTT connection management with Promise wrappers for mqtt.js callbacks
 */

import mqtt, { MqttClient } from 'mqtt';
import { MQTTConfig, MQTTPublishOptions } from './types';

const DEFAULT_PUBLISH_OPTIONS: MQTTPublishOptions = { qos: 1, retain: true };

/**
 * Create MQTT client with connection management
 * Returns an object with connect, publish, disconnect, and isConnected methods
 */
export function createMQTTClient(config: MQTTConfig) {
    let client: MqttClient | null = null;

    /**
   * Connect to MQTT broker
   * Returns a Promise that resolves when connected
   */
    const connect = async () => {
        return new Promise<void>((resolve, reject) => {
            const options: mqtt.IClientOptions = {
                username: config.username,
                password: config.password,
                clean: true,
                reconnectPeriod: 0, // Disable auto-reconnect for one-time jobs
            };

            client = mqtt.connect(config.brokerUrl, options);

            client.on('connect', () => {
                console.log('[MQTT] Connected to broker');
                resolve();
            });

            client.on('error', (error) => {
                console.error('[MQTT] Connection error:', error.message);
                reject(error);
            });
        });
    };

    /**
   * Publish a message to MQTT broker
   * Returns a Promise that resolves when message is published
   */
    const publish = async (topic: string, message: string, options: MQTTPublishOptions = DEFAULT_PUBLISH_OPTIONS) => {
        if (!client) {
            throw new Error('MQTT client not connected');
        }

        return new Promise<void>((resolve, reject) => {
            client!.publish(topic, message, options, (error) => {
                if (error) {
                    console.error(`[MQTT] Failed to publish to ${topic}:`, error.message);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    };

    /**
   * Disconnect from MQTT broker
   * Returns a Promise that resolves when disconnected
   */
    const disconnect = async () => {
        if (!client) 
            return;

        return new Promise<void>((resolve) => {
            client!.end(false, {}, () => {
                console.log('[MQTT] Disconnected');
                client = null;
                resolve();
            });
        });
    };

    /**
   * Check if client is connected
   */
    const isConnected = () => {
        return client?.connected ?? false;
    };

    return {
        connect,
        publish,
        disconnect,
        isConnected,
    };
}
