import { PublishedItem } from './types';

/**
 * Get statistics about cleanup operation
 */
export function getCleanupStats(previousItems: PublishedItem[], currentItems: PublishedItem[], removedIds: string[]) {
    const previousIds = new Set(previousItems.map(item => item.id));

    const newItems = currentItems.filter(item => !previousIds.has(item.id));
    const keptItems = currentItems.filter(item => previousIds.has(item.id));

    return {
        previous: previousItems.length,
        current: currentItems.length,
        removed: removedIds.length,
        kept: keptItems.length,
        new: newItems.length,
    };
}
