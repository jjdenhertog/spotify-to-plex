import { ParsedCondition, CombinatorType, FieldType, OperationType } from '../types/MatchFilterTypes';

export type Pill = {
    id: string;
    type: 'condition' | 'combinator';
    field?: FieldType;
    operation?: OperationType;
    threshold?: number;
    combinator?: CombinatorType;
    text: string;
};

export function expressionToPills(expression: string): Pill[] {
    if (!expression.trim()) {
        return [];
    }

    const pills: Pill[] = [];
    let pillId = 0;

    // Split by AND/OR while preserving the delimiters
    const tokens = expression.split(/\s+(AND|OR)\s+/);
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]?.trim();
        
        if (!token) {
            continue;
        }

        if (token === 'AND' || token === 'OR') {
            // This is a combinator
            pills.push({
                id: `pill-${pillId++}`,
                type: 'combinator',
                combinator: token as CombinatorType,
                text: token
            });
        } else {
            // This is a condition - parse it
            const condition = parseCondition(token);
            if (condition) {
                pills.push({
                    id: `pill-${pillId++}`,
                    type: 'condition',
                    field: condition.field,
                    operation: condition.operation,
                    threshold: condition.threshold,
                    text: token
                });
            } else {
                // Check if this is just a field name without operation
                const fieldOnlyPattern = /^(artist|title|album|artistWithTitle|artistInTitle)$/;
                const fieldMatch = fieldOnlyPattern.exec(token);
                
                if (fieldMatch) {
                    // This is a standalone field - create an incomplete pill
                    pills.push({
                        id: `pill-${pillId++}`,
                        type: 'condition',
                        field: fieldMatch[1] as FieldType,
                        text: token
                    });
                } else {
                    // Invalid condition - create a pill with the raw text
                    pills.push({
                        id: `pill-${pillId++}`,
                        type: 'condition',
                        text: token
                    });
                }
            }
        }
    }

    return pills;
}

function parseCondition(conditionText: string): ParsedCondition | null {
    // Match pattern: field:operation or field:operation>=threshold
    const conditionPattern = /^(artist|title|album|artistWithTitle|artistInTitle):(match|contains|similarity(?:>=\d*\.?\d+)?)$/;
    const match = conditionPattern.exec(conditionText);
    
    if (!match) {
        return null;
    }

    const [, fieldPart, operationPart] = match;
    const field = fieldPart as FieldType;

    if (!operationPart) {
        return null;
    }

    // Handle similarity with threshold
    const similarityMatch = /^similarity(?:>=(\d*\.?\d+))?$/.exec(operationPart);
    if (similarityMatch) {
        const [, thresholdStr] = similarityMatch;
        const threshold = thresholdStr ? parseFloat(thresholdStr) : 0.8;
        
        return {
            field,
            operation: 'similarity',
            threshold
        };
    }

    // Handle simple operations
    const operation = operationPart as OperationType;
    
    return {
        field,
        operation
    };
}