import { MatchFilterConfig } from '@spotify-to-plex/music-search/types/MatchFilterConfig';
import { validateMatchFilter, getMatchFilterValidationErrors, ValidationResult } from './validateMatchFilter';

/**
 * Validate array of match filters
 * Main implementation for validating multiple filters
 */
export const validateMatchFilters = (filters: any): filters is MatchFilterConfig[] => {
    return Array.isArray(filters) && filters.every(validateMatchFilter);
};

/**
 * Get detailed validation errors for an array of match filters
 */
export const getMatchFiltersValidationErrors = (filters: any): ValidationResult => {
    const errors: string[] = [];
    
    if (!Array.isArray(filters)) {
        return {
            valid: false,
            errors: ['Match filters must be an array']
        };
    }
    
    filters.forEach((filter, index) => {
        const filterErrors = getMatchFilterValidationErrors(filter);
        if (filterErrors.length > 0) {
            errors.push(`Filter at index ${index}: ${filterErrors.join(', ')}`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
};