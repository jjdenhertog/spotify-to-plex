import { ValidationResult } from './ValidationResult';

/**
 * Validate expression syntax for new expression format  
 * This is the main implementation file for expression validation
 */
export function validateExpression(expression: string): ValidationResult {
    const errors: string[] = [];
    
    try {
        // Check for empty expression
        if (!expression.trim()) {
            errors.push('Expression cannot be empty');

            return { valid: false, errors };
        }
        
        // Validate field names - check both standalone fields and fields with operations
        const validFields = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle'];
        
        // Extract fields with operations (allow spaces around colon)
        const fieldWithOpRegex = /([A-Za-z]+)\s*:/g;
        const fieldsWithOps = Array.from(expression.matchAll(fieldWithOpRegex), m => m[1]);
        
        // Extract standalone fields (not followed by colon, even with spaces)
        const standaloneFieldRegex = /\b(artist|title|album|artistWithTitle|artistInTitle)\b(?!\s*:)/g;
        const standaloneFields = Array.from(expression.matchAll(standaloneFieldRegex), m => m[1]);
        
        // Combine and validate all fields
        const allFields = [...fieldsWithOps, ...standaloneFields];
        
        for (const field of allFields) {
            if (field && !validFields.includes(field)) {
                errors.push(`Invalid field: "${field}". Valid fields are: ${validFields.join(', ')}`);
            }
        }
        
        // Validate operations
        const validOperations = ['match', 'contains', 'is', 'not', /^similarity>=(\d*\.?\d+)$/];
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
                errors.push(`Invalid operation: "${operation}". Valid operations are: match, contains, is, not, similarity>=0.0-1.0`);
            }
        }
        
        // Validate boolean operators - also check for invalid words that look like operators
        const operatorRegex = /\s+(AND|OR)\s+/g;
        const operators = Array.from(expression.matchAll(operatorRegex), m => m[1]);
        
        // Also check for words that might be intended as operators but aren't valid
        const invalidOperatorRegex = /\s+(but|xor|nor|nand)\s+/gi;
        const invalidOps = Array.from(expression.matchAll(invalidOperatorRegex), m => m[1]);
        
        if (invalidOps.length > 0) {
            errors.push(`Invalid operators: ${invalidOps.join(', ')}. Only AND, OR are supported`);
        }
        
        // Check for balanced conditions and operators
        // Count all conditions (both field:operation and standalone field)
        const conditions = expression.split(/\s+(?:AND|OR)\s+/);
        const conditionCount = conditions.length;
        const operatorCount = operators.length;
        
        if (conditionCount !== operatorCount + 1) {
            errors.push('Unbalanced expression: number of conditions must equal operators + 1');
        }
        
        // Check for proper syntax structure - allow both complete (field:operation) and incomplete (field) conditions
        // Allow flexible whitespace around colons and operators
        const conditionPattern = String.raw`[A-Za-z]+\s*(?::\s*[\d.=>A-Za-z]+)?`; // Operation is optional, with flexible spacing
        const conditionRegex = new RegExp(String.raw`^\s*${conditionPattern}(?:\s+(?:AND|OR)\s+${conditionPattern})*\s*$`);
        if (!conditionRegex.test(expression)) {
            errors.push('Invalid expression syntax. Expected format: "field[:operation] AND/OR field[:operation]"');
        }
        
    } catch (error) {
        errors.push(`Expression parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return { valid: errors.length === 0, errors };
}