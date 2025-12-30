/**
 * Get categories discovery topic
 */
export function getCategoriesDiscoveryTopic(topicPrefix: string, discoveryPrefix: string) {
    return `${discoveryPrefix}/sensor/${topicPrefix}_categories/config`;
}
