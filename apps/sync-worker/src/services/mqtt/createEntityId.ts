/**
 * Create entity ID from item ID
 * Sanitizes ID to be lowercase and replace special characters
 */
export function createEntityId(itemId: string, topicPrefix: string) {
    if (!itemId) {
        throw new Error('itemId is required for createEntityId');
    }

    const sanitized = itemId.toLowerCase().replace(/[^\da-z]/g, '');

    return `sensor.${topicPrefix}_item_${sanitized}`;
}
