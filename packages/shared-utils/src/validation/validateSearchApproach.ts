import { SearchApproachConfig } from '@spotify-to-plex/music-search/types/config';

/**
 * Validate search approach structure
 */
export const validateSearchApproach = (approach: any): approach is SearchApproachConfig => {
    return approach && 
           typeof approach === 'object' && 
           typeof approach.id === 'string' &&
           (approach.filtered === undefined || typeof approach.filtered === 'boolean') &&
           (approach.trim === undefined || typeof approach.trim === 'boolean') &&
           (approach.ignoreQuotes === undefined || typeof approach.ignoreQuotes === 'boolean') &&
           (approach.removeQuotes === undefined || typeof approach.removeQuotes === 'boolean') &&
           (approach.force === undefined || typeof approach.force === 'boolean');
};