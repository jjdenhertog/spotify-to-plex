import { Track } from "../types/Track";

/**
 * Parsed condition represents a single matching condition
 */
type ParsedCondition = {
    field: string;
    operation: 'match' | 'contains' | 'similarity' | 'is' | 'not';
    threshold?: number;
    negated?: boolean; // For 'not' operator
};

/**
 * Parsed expression represents the complete boolean expression
 */
type ParsedExpression = {
    conditions: ParsedCondition[];
    operators: ('AND' | 'OR')[];
};

/**
 * Safely parse expression syntax into executable filter function
 * Expression format: "artist:match AND title:contains"
 * Supported fields: artist, title, album, artistWithTitle, artistInTitle
 * Supported operations: :match, :contains, :is, :not, :similarity>=threshold
 * Supported combinators: AND, OR
 */
export function parseExpression(expression: string): (item: Track) => boolean {
    try {
        const parsed = parseExpressionString(expression);

        return (item: Track) => evaluateExpression(item, parsed);
    } catch (error) {
        // Return a filter that never matches on parse error
        // eslint-disable-next-line no-console
        console.warn(`Failed to parse expression: ${expression}`, String(error));

        return () => false;
    }
}

/**
 * Parse expression string into structured format
 */
function parseExpressionString(expression: string): ParsedExpression {
    // Split by AND/OR operators while preserving the operators
    const tokens = expression.split(/\s+(AND|OR)\s+/);
    
    const conditions: ParsedCondition[] = [];
    const operators: ('AND' | 'OR')[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
        if (i % 2 === 0) {
            // Even indices are conditions
            const token = tokens[i];

            if (token) {
                conditions.push(parseCondition(token.trim()));
            }
        } else {
            // Odd indices are operators
            const token = tokens[i];

            if (token) {
                const op = token.trim() as 'AND' | 'OR';

                if (op !== 'AND' && op !== 'OR') {
                    throw new Error(`Invalid operator: ${String(op)}`);
                }

                operators.push(op);
            }
        }
    }
    
    return { conditions, operators };
}

/**
 * Parse individual condition like "artist:match" or "title:similarity>=0.8"
 */
function parseCondition(conditionStr: string): ParsedCondition {
    const parts = conditionStr.split(':');

    if (parts.length !== 2) {
        throw new Error(`Invalid condition format: ${conditionStr}`);
    }
    
    const field = parts[0]?.trim();
    const operation = parts[1]?.trim();

    if (!field || !operation) {
        throw new Error(`Invalid condition format: ${conditionStr}`);
    }
    
    // Validate field
    const validFields = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle'];

    if (!validFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
    }
    
    // Parse operation
    if (operation === 'match' || operation === 'contains' || operation === 'is') {
        return { field, operation };
    }
    
    // Parse 'not' operation
    if (operation === 'not') {
        return { field, operation };
    }
    
    // Parse similarity operation with threshold
    const similarityMatch = /^similarity>=([\d.]+)$/.exec(operation);

    if (similarityMatch?.[1]) {
        const threshold = parseFloat(similarityMatch[1]);

        if (isNaN(threshold) || threshold < 0 || threshold > 1) {
            throw new Error(`Invalid similarity threshold: ${similarityMatch[1]}`);
        }

        return { field, operation: 'similarity', threshold };
    }
    
    throw new Error(`Invalid operation: ${operation}`);
}

/**
 * Evaluate parsed expression against track item
 */
function evaluateExpression(item: Track, parsed: ParsedExpression): boolean {
    const { conditions, operators } = parsed;
    
    if (conditions.length === 0) {
        return false;
    }
    
    // Evaluate first condition
    const [firstCondition] = conditions;

    if (!firstCondition) {
        return false;
    }

    let result = evaluateCondition(item, firstCondition);
    
    // Apply operators and remaining conditions
    for (let i = 0; i < operators.length && i + 1 < conditions.length; i++) {
        const nextCondition = conditions[i + 1];

        if (!nextCondition) {
            continue;
        }

        const nextResult = evaluateCondition(item, nextCondition);
        const operator = operators[i];
        
        if (operator === 'AND') {
            result &&= nextResult;
        } else if (operator === 'OR') {
            result ||= nextResult;
        }
    }
    
    return result;
}

/**
 * Evaluate single condition against track item
 */
function evaluateCondition(item: Track, condition: ParsedCondition): boolean {
    const { field, operation, threshold } = condition;
    
    // Get the matching field from the item
    const matchingField = getMatchingField(item, field);

    if (!matchingField) {
        return false;
    }
    
    switch (operation) {
        case 'match':
            return matchingField.match || false;
        case 'contains':
            return matchingField.contains || false;
        case 'is':
            // 'is' operator: exact match - both match AND contains must be true
            return (matchingField.match || false) && (matchingField.contains || false);
        case 'similarity':
            const similarity = matchingField.similarity ?? 0;
            
            return threshold === undefined ? false : similarity >= threshold;
        case 'not':
            // 'not' operator: negation of match result
            return !(matchingField.match || false);
        default:
            return false;
    }
}

/**
 * Get matching field from track item
 */
function getMatchingField(item: Track, field: string) {
    if(!item.matching)
        return null;

    switch (field) {
        case 'artist':
            return item.matching.artist;
        case 'title':
            return item.matching.title;
        case 'album':
            return item.matching.album;
        case 'artistWithTitle':
            return item.matching.artistWithTitle;
        case 'artistInTitle':
            return item.matching.artistInTitle;
        default:
            return null;
    }
}

/**
 * Migrate legacy filter function string to new expression format
 * This provides backward compatibility during transition
 */
export function migrateLegacyFilter(filterString: string): string | null {
    try {
        // Remove function wrapper and return statement
        const cleaned = filterString
            .replace(/^\(item\)\s*=>\s*/, '')
            .replace(/^return\s+/, '')
            .replace(/;$/, '')
            .trim();
        
        // Simple pattern matching for common cases
        const patterns = [
            // artist.match && title.match
            {
                pattern: /item\.matching\.artist\.match\s*&&\s*item\.matching\.title\.match/,
                expression: 'artist:match AND title:match'
            },
            // artist.match && title.contains
            {
                pattern: /item\.matching\.artist\.match\s*&&\s*item\.matching\.title\.contains/,
                expression: 'artist:match AND title:contains'
            },
            // artist.match && title.similarity >= 0.8
            {
                pattern: /item\.matching\.artist\.match\s*&&\s*\(item\.matching\.title\.similarity\s*\?\?\s*0\)\s*>=\s*([\d.]+)/,
                expression: (match: RegExpMatchArray) => `artist:match AND title:similarity>=${match[1]}`
            },
            // artist.contains && title.match
            {
                pattern: /item\.matching\.artist\.contains\s*&&\s*item\.matching\.title\.match/,
                expression: 'artist:contains AND title:match'
            },
            // artist.contains && title.similarity >= threshold
            {
                pattern: /item\.matching\.artist\.contains\s*&&\s*\(item\.matching\.title\.similarity\s*\?\?\s*0\)\s*>=\s*([\d.]+)/,
                expression: (match: RegExpMatchArray) => `artist:contains AND title:similarity>=${match[1]}`
            },
            // artist.contains && title.contains && album.contains
            {
                pattern: /item\.matching\.artist\.contains\s*&&\s*item\.matching\.title\.contains\s*&&\s*item\.matching\.album\.contains/,
                expression: 'artist:contains AND title:contains AND album:contains'
            },
            // artist.similarity >= threshold && title.similarity >= threshold
            {
                pattern: /\(item\.matching\.artist\.similarity\s*\?\?\s*0\)\s*>=\s*([\d.]+)\s*&&\s*\(item\.matching\.title\.similarity\s*\?\?\s*0\)\s*>=\s*([\d.]+)/,
                expression: (match: RegExpMatchArray) => `artist:similarity>=${match[1]} AND title:similarity>=${match[2]}`
            },
            // artistWithTitle.similarity >= threshold
            {
                pattern: /\(item\.matching\.artistWithTitle\.similarity\s*\?\?\s*0\)\s*>=\s*([\d.]+)/,
                expression: (match: RegExpMatchArray) => `artistWithTitle:similarity>=${match[1]}`
            },
            // artist.similarity >= 0.7 && album.match && title.similarity >= threshold
            {
                pattern: /\(item\.matching\.artist\.similarity\s*\?\?\s*0\)\s*>=\s*([\d.]+)\s*&&\s*item\.matching\.album\.match\s*&&\s*\(item\.matching\.title\.similarity\s*\?\?\s*0\)\s*>=\s*([\d.]+)/,
                expression: (match: RegExpMatchArray) => `artist:similarity>=${match[1]} AND album:match AND title:similarity>=${match[2]}`
            },
            // artist.match && artist.contains (exact match)
            {
                pattern: /item\.matching\.artist\.match\s*&&\s*item\.matching\.artist\.contains/,
                expression: 'artist:is'
            },
            // title.match && title.contains (exact match)
            {
                pattern: /item\.matching\.title\.match\s*&&\s*item\.matching\.title\.contains/,
                expression: 'title:is'
            },
            // !artist.match (negation)
            {
                pattern: /!item\.matching\.artist\.match/,
                expression: 'artist:not'
            },
            // !title.match (negation)
            {
                pattern: /!item\.matching\.title\.match/,
                expression: 'title:not'
            },
            // !(artist.match && title.match) -> artist:not OR title:not
            {
                pattern: /!\(item\.matching\.artist\.match\s*&&\s*item\.matching\.title\.match\)/,
                expression: 'artist:not OR title:not'
            }
        ];
        
        for (const { pattern, expression } of patterns) {
            const match = cleaned.match(pattern);

            if (match) {
                if (typeof expression === 'function') {
                    return expression(match);
                }

                return expression;
            }
        }
        
        // If no pattern matches, return null to indicate migration failed
        return null;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to migrate legacy filter: ${filterString}`, String(error));

        return null;
    }
}