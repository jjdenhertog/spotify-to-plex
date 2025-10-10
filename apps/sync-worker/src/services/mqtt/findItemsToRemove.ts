import { PublishedItem } from './types';

/**
 * Find items that need to be removed
 * Returns IDs of items that were published before but are not in current list
 */
export function findItemsToRemove(previousItems: PublishedItem[], currentItems: PublishedItem[]): string[] {
    const currentIds = new Set(currentItems.map(item => item.id).filter(Boolean));
    const toRemove: string[] = [];

    for (const item of previousItems) {
        // Skip items with undefined/null IDs
        if (item?.id && !currentIds.has(item.id)) {
            toRemove.push(item.id);
        }
    }

    return toRemove;
}
