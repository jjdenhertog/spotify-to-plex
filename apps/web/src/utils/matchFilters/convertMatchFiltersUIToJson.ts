import type { UIMatchFilterConfig } from './convertMatchFiltersJsonToUI';

/**
 * Converts UI-friendly structured format back to expression string format
 * 
 * @param uiConfig - UI-friendly structured representation
 * @returns Expression string like "artist:match AND title:contains"
 * 
 * @example
 * // Input: {
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
 * // Output: "artist:match AND title:contains"
 */
export function convertMatchFiltersUIToJson(uiConfig: UIMatchFilterConfig): string {
    if (!uiConfig?.rules || uiConfig.rules.length === 0) {
        return '';
    }

    const ruleExpressions = uiConfig.rules
        .map(rule => convertRuleToExpression(rule))
        .filter(expr => expr.trim() !== '');

    if (ruleExpressions.length === 0) {
        return '';
    }

    if (ruleExpressions.length === 1) {
        return ruleExpressions[0] || '';
    }

    // Join multiple rules with the global combinator (default: OR)
    const globalCombinator = uiConfig.globalCombinator || 'OR';

    return ruleExpressions.join(` ${globalCombinator} `);
}

/**
 * Converts a single UI rule to expression format
 * 
 * @private
 * @param rule - UI rule with conditions and combinator
 * @returns Expression string for the rule
 */
function convertRuleToExpression(rule: UIMatchFilterConfig['rules'][0]): string {
    if (!rule.conditions || rule.conditions.length === 0) {
        return '';
    }

    const conditionExpressions = rule.conditions
        .map(condition => convertConditionToExpression(condition))
        .filter(expr => expr.trim() !== '');

    if (conditionExpressions.length === 0) {
        return '';
    }

    if (conditionExpressions.length === 1) {
        return conditionExpressions[0] || '';
    }

    // Join conditions with the rule's combinator
    const combinator = rule.combinator || 'AND';

    return conditionExpressions.join(` ${combinator} `);
}

/**
 * Converts a single UI condition to expression format
 * 
 * @private
 * @param condition - UI condition with field, operation, and optional threshold
 * @returns Expression string for the condition
 */
function convertConditionToExpression(condition: UIMatchFilterConfig['rules'][0]['conditions'][0]): string {
    if (!condition.field || !condition.operation) {
        return '';
    }

    // Handle similarity operation with threshold
    if (condition.operation === 'similarity') {
        const threshold = condition.threshold === undefined ? 0.8 : condition.threshold;
        // Ensure threshold is between 0 and 1
        const clampedThreshold = Math.max(0, Math.min(1, threshold));

        return `${condition.field}:similarity>=${clampedThreshold}`;
    }

    // Handle other operations (match, contains)
    return `${condition.field}:${condition.operation}`;
}

/**
 * Validates a UI match filter configuration
 * 
 * @param uiConfig - UI configuration to validate
 * @returns Validation result with errors if any
 */
export function validateUIMatchFilterConfig(uiConfig: UIMatchFilterConfig): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!uiConfig) {
        errors.push('Configuration is required');

        return { isValid: false, errors };
    }

    if (!uiConfig.rules) {
        errors.push('Rules array is required');

        return { isValid: false, errors };
    }

    if (uiConfig.rules.length === 0) {
        errors.push('At least one rule is required');

        return { isValid: false, errors };
    }

    // Validate global combinator
    if (uiConfig.globalCombinator && !['AND', 'OR'].includes(uiConfig.globalCombinator)) {
        errors.push(`Invalid global combinator: ${uiConfig.globalCombinator}. Must be 'AND' or 'OR'`);
    }

    // Validate each rule
    uiConfig.rules.forEach((rule, ruleIndex) => {
        const ruleErrors = validateUIRule(rule, ruleIndex);
        errors.push(...ruleErrors);
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates a single UI rule
 * 
 * @private
 * @param rule - Rule to validate
 * @param ruleIndex - Index of the rule for error messages
 * @returns Array of validation errors
 */
function validateUIRule(rule: UIMatchFilterConfig['rules'][0], ruleIndex: number): string[] {
    const errors: string[] = [];
    const rulePrefix = `Rule ${ruleIndex + 1}:`;

    if (!rule) {
        errors.push(`${rulePrefix} Rule is required`);

        return errors;
    }

    if (!rule.id) {
        errors.push(`${rulePrefix} Rule ID is required`);
    }

    if (!rule.conditions) {
        errors.push(`${rulePrefix} Conditions array is required`);

        return errors;
    }

    if (rule.conditions.length === 0) {
        errors.push(`${rulePrefix} At least one condition is required`);

        return errors;
    }

    // Validate combinator
    if (rule.combinator && !['AND', 'OR'].includes(rule.combinator)) {
        errors.push(`${rulePrefix} Invalid combinator: ${rule.combinator}. Must be 'AND' or 'OR'`);
    }

    // Validate each condition
    rule.conditions.forEach((condition, condIndex) => {
        const condErrors = validateUICondition(condition, ruleIndex, condIndex);
        errors.push(...condErrors);
    });

    return errors;
}

/**
 * Validates a single UI condition
 * 
 * @private
 * @param condition - Condition to validate
 * @param ruleIndex - Index of the parent rule
 * @param condIndex - Index of the condition
 * @returns Array of validation errors
 */
function validateUICondition(
    condition: UIMatchFilterConfig['rules'][0]['conditions'][0],
    ruleIndex: number,
    condIndex: number
): string[] {
    const errors: string[] = [];
    const condPrefix = `Rule ${ruleIndex + 1}, Condition ${condIndex + 1}:`;

    if (!condition) {
        errors.push(`${condPrefix} Condition is required`);

        return errors;
    }

    if (!condition.id) {
        errors.push(`${condPrefix} Condition ID is required`);
    }

    // Validate field
    const validFields = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle'];
    if (!condition.field) {
        errors.push(`${condPrefix} Field is required`);
    } else if (!validFields.includes(condition.field)) {
        errors.push(`${condPrefix} Invalid field: ${condition.field}. Must be one of: ${validFields.join(', ')}`);
    }

    // Validate operation
    const validOperations = ['match', 'contains', 'similarity'];
    if (!condition.operation) {
        errors.push(`${condPrefix} Operation is required`);
    } else if (!validOperations.includes(condition.operation)) {
        errors.push(`${condPrefix} Invalid operation: ${condition.operation}. Must be one of: ${validOperations.join(', ')}`);
    }

    // Validate threshold for similarity operations
    if (condition.operation === 'similarity') {
        if (condition.threshold === undefined) {
            errors.push(`${condPrefix} Threshold is required for similarity operations`);
        } else if (typeof condition.threshold !== 'number') {
            errors.push(`${condPrefix} Threshold must be a number`);
        } else if (condition.threshold < 0 || condition.threshold > 1) {
            errors.push(`${condPrefix} Threshold must be between 0 and 1`);
        }
    }

    return errors;
}