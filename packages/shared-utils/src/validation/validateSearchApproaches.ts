import { SearchApproachConfig } from '@spotify-to-plex/music-search/types/config';
import { validateSearchApproach } from './validateSearchApproach';

/**
 * Validate array of search approaches
 */
export const validateSearchApproaches = (approaches: any): approaches is SearchApproachConfig[] => {
    return Array.isArray(approaches) && approaches.every(validateSearchApproach);
};