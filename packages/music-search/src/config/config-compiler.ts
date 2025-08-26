/**
 * Configuration compiler - converts structured config to runtime functions
 * Preserves exact current matching logic
 */

import { TrackWithMatching } from '../types/TrackWithMatching';
import { 
    MatchCondition, 
    MatchFilterConfig, 
    RuntimeMatchFilter,
    ConfigValidationResult
} from '../types/config';

export class ConfigCompiler {
  
    /**
   * Compiles match filter configuration into executable runtime filters
   * Preserves exact priority order and boolean logic from current code
   */
    public static compileMatchFilters(filters: readonly MatchFilterConfig[]): RuntimeMatchFilter[] {
        return filters.map(filter => ({
            reason: filter.reason,
            filter: this.compileCondition(filter.condition)
        }));
    }

    /**
   * Compiles a match condition into a runtime function
   * Handles all boolean logic combinations from current hardcoded filters
   */
    private static compileCondition(condition: MatchCondition): (item: TrackWithMatching) => boolean {
    // Handle compound conditions (AND/OR)
        if ('type' in condition && (condition.type === 'and' || condition.type === 'or')) {
            const leftFn = this.compileCondition(condition.left);
            const rightFn = this.compileCondition(condition.right);
      
            if (condition.type === 'and') {
                return (item: TrackWithMatching) => leftFn(item) && rightFn(item);
            }
 
            return (item: TrackWithMatching) => leftFn(item) || rightFn(item);
      
        }

        // Handle single field conditions
        if ('field' in condition) {
            switch (condition.field) {
                case 'artist':
                    return this.compileFieldCondition('artist', condition.type, 
                        'threshold' in condition ? condition.threshold : undefined);
            
                case 'title':
                    return this.compileFieldCondition('title', condition.type,
                        'threshold' in condition ? condition.threshold : undefined);
            
                case 'album':
                    return this.compileFieldCondition('album', condition.type,
                        'threshold' in condition ? condition.threshold : undefined);
            
                case 'artistWithTitle':
                    return this.compileFieldCondition('artistWithTitle', condition.type,
                        'threshold' in condition ? condition.threshold : undefined);
            
                default:
                    throw new Error(`Unknown field: ${(condition as any).field}`);
            }
        }

        throw new Error(`Invalid condition structure: ${JSON.stringify(condition)}`);
    }

    /**
   * Compiles individual field conditions to match current logic exactly
   */
    private static compileFieldCondition(
        field: keyof TrackWithMatching['matching'],
        type: 'match' | 'contains' | 'similarity',
        threshold?: number
    ): (item: TrackWithMatching) => boolean {
    
        switch (type) {
            case 'match':
                return (item: TrackWithMatching) => {
                    return item.matching[field]?.match ?? false;
                };
        
            case 'contains':
                return (item: TrackWithMatching) => {
                    return item.matching[field]?.contains ?? false;
                };
        
            case 'similarity':
                if (threshold === undefined) {
                    throw new Error(`Similarity condition requires threshold for field: ${field}`);
                }

                return (item: TrackWithMatching) => {
                    return (item.matching[field]?.similarity ?? 0) >= threshold;
                };
        
            default:
                throw new Error(`Unknown condition type: ${type}`);
        }
    }

    /**
   * Validates configuration structure and values
   * Ensures config can be compiled without runtime errors
   */
    public static validateConfig(filters: readonly MatchFilterConfig[]): ConfigValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Try to compile all filters - will throw if invalid
            this.compileMatchFilters(filters);
      
            // Additional validation rules
            if (filters.length === 0) {
                warnings.push('No match filters defined - searches will always return empty results');
            }

            // Validate threshold values
            filters.forEach((filter, index) => {
                this.validateThresholds(filter.condition, `Filter ${index}`, errors);
            });

        } catch (error) {
            errors.push(`Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
   * Recursively validates threshold values in conditions
   */
    private static validateThresholds(condition: MatchCondition, path: string, errors: string[]): void {
        if ('type' in condition && (condition.type === 'and' || condition.type === 'or')) {
            this.validateThresholds(condition.left, `${path}.left`, errors);
            this.validateThresholds(condition.right, `${path}.right`, errors);
        } else if ('field' in condition && 'threshold' in condition) {
            const {threshold} = condition;
            if (threshold < 0 || threshold > 1) {
                errors.push(`${path}: Similarity threshold must be between 0 and 1, got ${threshold}`);
            }
        }
    }
}