import type { FieldType, OperationType, CombinatorType } from '../../types/MatchFilterTypes';

/**
 * UI-friendly representation of a match filter condition
 * Designed for easy editing in table/form interfaces
 */
export type UIMatchFilterCondition = {
    id: string;
    field: FieldType;
    operation: OperationType;
    threshold?: number; // For similarity operations (0-1)
};

/**
 * UI-friendly representation of a complete match filter rule
 * Each rule contains conditions connected by a single operator type
 */
export type UIMatchFilterRule = {
    id: string;
    conditions: UIMatchFilterCondition[];
    combinator: CombinatorType; // How conditions within this rule are combined
    name?: string; // Optional display name for the rule
};

/**
 * Collection of UI match filter rules
 * Multiple rules can be combined (typically with OR logic)
 */
export type UIMatchFilterConfig = {
    rules: UIMatchFilterRule[];
    globalCombinator?: CombinatorType; // How multiple rules are combined (default: OR)
};

/**
 * Converts expression string format to UI-friendly structured format
 * 
 * @param expression - Expression string like "artist:match AND title:contains"
 * @returns UI-friendly structured representation
 * 
 * @example
 * // Input: "artist:match AND title:contains"
 * // Output: {
 * //   rules: [{
 * //     id: "rule-0",
 * //     conditions: [
 * //       { id: "cond-0", field: "artist", operation: "match" },
 * //       { id: "cond-1", field: "title", operation: "contains" }
 * //     ],
 * //     combinator: "AND"
 * //   }],
 * //   globalCombinator: "OR"
 * // }
 */
export function convertMatchFiltersJsonToUI(expression: string): UIMatchFilterConfig {
    if (!expression?.trim()) {
        return {
            rules: [],
            globalCombinator: 'OR'
        };
    }

    // Split by OR first to create separate rules
    const orParts = expression.split(/\s+OR\s+/);
    const rules: UIMatchFilterRule[] = [];

    orParts.forEach((orPart, ruleIndex) => {
        const trimmedPart = orPart.trim();
        if (!trimmedPart) return;

        // Split by AND to get individual conditions
        const andParts = trimmedPart.split(/\s+AND\s+/);
        const conditions: UIMatchFilterCondition[] = [];

        andParts.forEach((andPart, condIndex) => {
            const trimmedCondition = andPart.trim();
            if (!trimmedCondition) return;

            const parsedCondition = parseCondition(trimmedCondition);
            if (parsedCondition) {
                conditions.push({
                    id: `cond-${ruleIndex}-${condIndex}`,
                    ...parsedCondition
                });
            }
        });

        if (conditions.length > 0) {
            rules.push({
                id: `rule-${ruleIndex}`,
                conditions,
                combinator: 'AND', // Conditions within a rule are connected by AND
                name: `Filter ${ruleIndex + 1}`
            });
        }
    });

    return {
        rules,
        globalCombinator: 'OR' // Multiple rules are combined with OR
    };
}

/**
 * Parses a single condition from expression format
 * 
 * @private
 * @param conditionText - Single condition like "artist:match" or "title:similarity>=0.8"
 * @returns Parsed condition or null if invalid
 */
function parseCondition(conditionText: string): Omit<UIMatchFilterCondition, 'id'> | null {
    // Match pattern: field:operation or field:similarity>=threshold
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
            threshold: Math.max(0, Math.min(1, threshold)) // Clamp between 0 and 1
        };
    }

    // Handle simple operations
    const operation = operationPart as OperationType;
    
    return {
        field,
        operation
    };
}