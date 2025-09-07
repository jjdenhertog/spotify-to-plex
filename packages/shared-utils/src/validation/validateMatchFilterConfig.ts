import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';
import { validateExpression } from './validateExpression';

/**
 * Validate match filter structure supporting both legacy and expression formats
 */
export function validateMatchFilterConfig(filter: any): filter is MatchFilterConfig {
    if (!filter || typeof filter !== 'object' || typeof filter.reason !== 'string') {
        return false;
    }
    
    const hasFilter = typeof filter.filter === 'string';
    const hasExpression = typeof filter.expression === 'string';
    
    // Must have either filter (legacy) or expression (new format)
    if (!hasFilter && !hasExpression) {
        return false;
    }
    
    // If expression is provided, validate it
    if (hasExpression) {
        const validation = validateExpression(filter.expression);
        if (!validation.valid) {
            // Validation errors not logged to avoid console warnings

            return false;
        }
    }
    
    return true;
}