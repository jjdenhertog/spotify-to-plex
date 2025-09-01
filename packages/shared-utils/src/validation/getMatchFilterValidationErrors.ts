import { validateExpression } from './validateExpression';

/**
 * Get detailed validation errors for a match filter
 */
export function getMatchFilterValidationErrors(filter: any): string[] {
    const errors: string[] = [];
    
    if (!filter || typeof filter !== 'object') {
        errors.push('Filter must be an object');

        return errors;
    }
    
    if (typeof filter.reason !== 'string') {
        errors.push('Filter must have a "reason" property of type string');
    }
    
    const hasFilter = typeof filter.filter === 'string';
    const hasExpression = typeof filter.expression === 'string';
    
    if (!hasFilter && !hasExpression) {
        errors.push('Filter must have either "filter" (legacy) or "expression" (new format) property');
    }
    
    if (hasExpression) {
        const validation = validateExpression(filter.expression);
        errors.push(...validation.errors);
    }
    
    return errors;
}