/**
 * Get categories state topic
 */
export function getCategoriesStateTopic(topicPrefix: string): string {
    return `${topicPrefix}/categories/state`;
}
