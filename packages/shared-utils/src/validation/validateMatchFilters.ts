import { MatchFilterConfig } from '@spotify-to-plex/music-search/types/MatchFilterConfig';
import { validateMatchFilter } from './validateMatchFilter';

/**
 * Validate array of match filters
 */
export const validateMatchFilters = (filters: any): filters is MatchFilterConfig[] => {
    return Array.isArray(filters) && filters.every(validateMatchFilter);
};