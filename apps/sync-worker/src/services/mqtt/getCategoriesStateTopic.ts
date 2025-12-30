/**
 * Get categories state topic
 */
export function getCategoriesStateTopic(topicPrefix: string) {
    return `${topicPrefix}/categories/state`;
}
