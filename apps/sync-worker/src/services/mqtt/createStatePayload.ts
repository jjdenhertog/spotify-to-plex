import { MQTTEntity } from './types';

/**
 * Create state payload for an entity
 */
export function createStatePayload(entity: MQTTEntity): string {
    return JSON.stringify(entity, null, 2);
}
