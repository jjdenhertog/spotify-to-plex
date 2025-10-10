/**
 * Build categories entity
 */
export function buildCategoriesEntity(categories: string[]) {
    return {
        state: categories.join(','),
        attributes: {
            icon: 'mdi:music',
            friendly_name: 'Music Categories',
        },
    };
}
