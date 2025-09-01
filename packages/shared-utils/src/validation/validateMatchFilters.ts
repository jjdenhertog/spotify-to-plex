import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';
import { ValidationResult } from './ValidationResult';
import { validateMatchFilterConfig } from './validateMatchFilterConfig';
import { getMatchFilterValidationErrors } from './getMatchFilterValidationErrors';

/**
 * Validate array of match filters
 * Main implementation for validating multiple filters
 */
export function validateMatchFilters(filters: any): filters is MatchFilterConfig[] {
    return Array.isArray(filters) && filters.every(validateMatchFilterConfig);
}

/**
 * Get detailed validation errors for an array of match filters
 */
export function getMatchFiltersValidationErrors(filters: any): ValidationResult {
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