import { MatchFilterConfig } from '@spotify-to-plex/music-search/types/config';

/**
 * Validate match filter structure
 */
export const validateMatchFilter = (filter: any): filter is MatchFilterConfig => {
    return filter && 
           typeof filter === 'object' && 
           typeof filter.reason === 'string' && 
           typeof filter.filter === 'string';
};