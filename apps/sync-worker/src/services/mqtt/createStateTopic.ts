/**
 * Create state topic for an entity
 */
export function createStateTopic(itemId: string, topicPrefix: string) {
    return `${topicPrefix}/items/${itemId}/state`;
}
