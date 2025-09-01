import { MatchFilterConfig } from '@spotify-to-plex/music-search/types/MatchFilterConfig';

/**
 * Validation result with detailed error information
 */
export type ValidationResult = {
    valid: boolean;
    errors: string[];
};

/**
 * Validate expression syntax for new expression format  
 * This is the main implementation file for match filter validation
 */
export const validateExpression = (expression: string): ValidationResult => {
    const errors: string[] = [];
    
    try {
        // Check for empty expression
        if (!expression.trim()) {
            errors.push('Expression cannot be empty');

            return { valid: false, errors };
        }
        
        // Validate field names
        const validFields = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle'];
        const fieldRegex = /([A-Za-z]+):/g;
        const fields = Array.from(expression.matchAll(fieldRegex), m => m[1]);
        
        for (const field of fields) {
            if (field && !validFields.includes(field)) {
                errors.push(`Invalid field: "${field}". Valid fields are: ${validFields.join(', ')}`);
            }
        }
        
        // Validate operations
        const validOperations = ['match', 'contains', /^similarity>=(\d*\.?\d+)$/];
        const operationRegex = /:\s*(\S+)(?:\s|$)/g;
        const operations = Array.from(expression.matchAll(operationRegex), m => m[1]);
        
        for (const operation of operations) {
            if (!operation) {
                continue;
            }
            
            const isValidOperation = validOperations.some(validOp => {
                if (typeof validOp === 'string') {
                    return validOp === operation;
                }

                {
                    const match = operation.match(validOp);
                    if (match?.[1]) {
                        const threshold = parseFloat(match[1]);
                        if (isNaN(threshold) || threshold < 0 || threshold > 1) {
                            errors.push(`Invalid similarity threshold: "${match[1]}". Must be between 0 and 1`);

                            return false;
                        }

                        return true;
                    }

                    return false;
                }
            });
            
            if (!isValidOperation) {
                errors.push(`Invalid operation: "${operation}". Valid operations are: match, contains, similarity>=0.0-1.0`);
            }
        }
        
        // Validate boolean operators
        const operatorRegex = /\s+(AND|OR)\s+/g;
        const operators = Array.from(expression.matchAll(operatorRegex), m => m[1]);
        const invalidOperators = operators.filter(op => op !== 'AND' && op !== 'OR');
        
        if (invalidOperators.length > 0) {
            errors.push(`Invalid operators: ${invalidOperators.join(', ')}. Only AND, OR are supported`);
        }
        
        // Check for balanced conditions and operators
        const conditionCount = expression.split(/\s+(?:AND|OR)\s+/).length;
        const operatorCount = operators.length;
        
        if (conditionCount !== operatorCount + 1) {
            errors.push('Unbalanced expression: number of conditions must equal operators + 1');
        }
        
        // Check for proper syntax structure
        const conditionRegex = /^\s*[A-Za-z]+:[\d.=>A-Za-z]+(?:\s+(?:AND|OR)\s+[A-Za-z]+:[\d.=>A-Za-z]+)*\s*$/;
        if (!conditionRegex.test(expression)) {
            errors.push('Invalid expression syntax. Expected format: "field:operation AND/OR field:operation"');
        }
        
    } catch (error) {
        errors.push(`Expression parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return { valid: errors.length === 0, errors };
};

/**
 * Validate match filter structure supporting both legacy and expression formats
 */
export const validateMatchFilter = (filter: any): filter is MatchFilterConfig => {
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
            // Log validation errors for debugging but still return false
            console.warn('Expression validation failed:', validation.errors);

            return false;
        }
    }
    
    return true;
};

/**
 * Get detailed validation errors for a match filter
 */
export const getMatchFilterValidationErrors = (filter: any): string[] => {
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
};