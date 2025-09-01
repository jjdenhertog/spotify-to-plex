/**
 * Unit tests for expression generation from pills
 * Tests the bidirectional conversion between expressions and pill data structures
 */

import { expressionToPills, Pill } from '../../apps/web/src/utils/expressionToPills';
import { pillsToExpression } from '../../apps/web/src/utils/pillsToExpression';
import { FieldType, OperationType } from '../../apps/web/src/types/MatchFilterTypes';

describe('Expression to Pills Conversion', () => {
    test('should parse empty expression', () => {
        const pills = expressionToPills('');
        expect(pills).toEqual([]);
    });

    test('should parse simple field:operation expression', () => {
        const pills = expressionToPills('artist:match');
        
        expect(pills).toHaveLength(1);
        expect(pills[0]).toMatchObject({
            type: 'condition',
            field: 'artist',
            operation: 'match',
            text: 'artist:match'
        });
    });

    test('should parse expression with AND combinator', () => {
        const pills = expressionToPills('artist:match AND title:contains');
        
        expect(pills).toHaveLength(3);
        expect(pills[0].type).toBe('condition');
        expect(pills[1].type).toBe('combinator');
        expect(pills[2].type).toBe('condition');
        expect(pills[1].combinator).toBe('AND');
    });

    test('should parse expression with OR combinator', () => {
        const pills = expressionToPills('artist:match OR title:contains');
        
        expect(pills).toHaveLength(3);
        expect(pills[1].combinator).toBe('OR');
    });

    test('should parse similarity operations with thresholds', () => {
        const testCases = [
            { input: 'artist:similarity>=0.8', expectedThreshold: 0.8 },
            { input: 'title:similarity>=0.85', expectedThreshold: 0.85 },
            { input: 'album:similarity>=0.9', expectedThreshold: 0.9 },
            { input: 'artistWithTitle:similarity>=0.75', expectedThreshold: 0.75 }
        ];

        testCases.forEach(({ input, expectedThreshold }) => {
            const pills = expressionToPills(input);
            expect(pills).toHaveLength(1);
            expect(pills[0].operation).toBe('similarity');
            expect(pills[0].threshold).toBe(expectedThreshold);
        });
    });

    test('should handle complex expressions with multiple combinators', () => {
        const pills = expressionToPills('artist:match AND title:contains OR album:similarity>=0.8');
        
        expect(pills).toHaveLength(5); // 3 conditions + 2 combinators
        expect(pills.filter(p => p.type === 'condition')).toHaveLength(3);
        expect(pills.filter(p => p.type === 'combinator')).toHaveLength(2);
    });

    test('should assign unique IDs to pills', () => {
        const pills = expressionToPills('artist:match AND title:contains');
        const ids = pills.map(p => p.id);
        
        expect(new Set(ids).size).toBe(ids.length); // All IDs should be unique
        expect(ids.every(id => id.startsWith('pill-'))).toBe(true);
    });

    test('should handle malformed expressions gracefully', () => {
        const malformedExpressions = [
            'artist:', // Missing operation
            ':match', // Missing field
            'artist:invalidop', // Invalid operation
            'invalidfield:match', // Invalid field
            'artist:match AND', // Incomplete combinator
            'AND artist:match' // Leading combinator
        ];

        malformedExpressions.forEach(expression => {
            expect(() => expressionToPills(expression)).not.toThrow();
            const pills = expressionToPills(expression);
            expect(Array.isArray(pills)).toBe(true);
        });
    });
});

describe('Pills to Expression Conversion', () => {
    test('should generate empty expression from empty pills array', () => {
        const expression = pillsToExpression([]);
        expect(expression).toBe('');
    });

    test('should generate simple expression from single condition pill', () => {
        const pills: Pill[] = [{
            id: 'pill-1',
            type: 'condition',
            field: 'artist',
            operation: 'match',
            text: 'artist:match'
        }];

        const expression = pillsToExpression(pills);
        expect(expression).toBe('artist:match');
    });

    test('should generate expression with combinators', () => {
        const pills: Pill[] = [
            {
                id: 'pill-1',
                type: 'condition',
                field: 'artist',
                operation: 'match',
                text: 'artist:match'
            },
            {
                id: 'pill-2',
                type: 'combinator',
                combinator: 'AND',
                text: 'AND'
            },
            {
                id: 'pill-3',
                type: 'condition',
                field: 'title',
                operation: 'contains',
                text: 'title:contains'
            }
        ];

        const expression = pillsToExpression(pills);
        expect(expression).toBe('artist:match AND title:contains');
    });

    test('should generate similarity expressions with thresholds', () => {
        const pills: Pill[] = [{
            id: 'pill-1',
            type: 'condition',
            field: 'artist',
            operation: 'similarity',
            threshold: 0.85,
            text: 'artist:similarity>=0.85'
        }];

        const expression = pillsToExpression(pills);
        expect(expression).toBe('artist:similarity>=0.85');
    });

    test('should handle complex expressions with multiple combinators', () => {
        const pills: Pill[] = [
            { id: 'pill-1', type: 'condition', field: 'artist', operation: 'match', text: 'artist:match' },
            { id: 'pill-2', type: 'combinator', combinator: 'AND', text: 'AND' },
            { id: 'pill-3', type: 'condition', field: 'title', operation: 'contains', text: 'title:contains' },
            { id: 'pill-4', type: 'combinator', combinator: 'OR', text: 'OR' },
            { id: 'pill-5', type: 'condition', field: 'album', operation: 'similarity', threshold: 0.8, text: 'album:similarity>=0.8' }
        ];

        const expression = pillsToExpression(pills);
        expect(expression).toBe('artist:match AND title:contains OR album:similarity>=0.8');
    });

    test('should handle pills with missing field or operation', () => {
        const pills: Pill[] = [
            { id: 'pill-1', type: 'condition', text: 'invalid:condition' },
            { id: 'pill-2', type: 'condition', field: 'artist', text: 'artist:?' }
        ];

        const expression = pillsToExpression(pills);
        expect(expression).toBe('invalid:condition artist:?');
    });
});

describe('Bidirectional Conversion Consistency', () => {
    test('should maintain consistency through round-trip conversion', () => {
        const testExpressions = [
            'artist:match',
            'artist:match AND title:contains',
            'artist:similarity>=0.8',
            'artist:match AND title:contains AND album:match',
            'artist:similarity>=0.85 AND title:match',
            'artist:match OR title:contains',
            'artist:match AND title:contains OR album:similarity>=0.9'
        ];

        testExpressions.forEach(originalExpression => {
            const pills = expressionToPills(originalExpression);
            const regeneratedExpression = pillsToExpression(pills);
            
            // Should maintain semantic equivalence
            expect(regeneratedExpression).toBeTruthy();
            
            // Parse again to ensure consistency
            const secondParsePills = expressionToPills(regeneratedExpression);
            const secondExpression = pillsToExpression(secondParsePills);
            
            expect(secondExpression).toBe(regeneratedExpression);
        });
    });

    test('should handle whitespace variations consistently', () => {
        const expressions = [
            'artist:match AND title:contains',
            ' artist:match AND title:contains ',
            'artist:match  AND  title:contains',
            'artist:match\tAND\ttitle:contains'
        ];

        const results = expressions.map(expr => {
            const pills = expressionToPills(expr);
            return pillsToExpression(pills);
        });

        // All should normalize to the same result
        const normalizedResult = results[0];
        results.forEach(result => {
            expect(result.trim().replace(/\s+/g, ' ')).toBe(normalizedResult.trim().replace(/\s+/g, ' '));
        });
    });

    test('should preserve all field types through conversion', () => {
        const fields: FieldType[] = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle'];
        const operations: OperationType[] = ['match', 'contains', 'similarity'];

        fields.forEach(field => {
            operations.forEach(operation => {
                const expression = operation === 'similarity' 
                    ? `${field}:${operation}>=0.8`
                    : `${field}:${operation}`;
                
                const pills = expressionToPills(expression);
                const regenerated = pillsToExpression(pills);
                
                expect(regenerated).toContain(field);
                expect(regenerated).toContain(operation);
            });
        });
    });

    test('should handle threshold precision correctly', () => {
        const thresholds = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
        
        thresholds.forEach(threshold => {
            const expression = `artist:similarity>=${threshold}`;
            const pills = expressionToPills(expression);
            const regenerated = pillsToExpression(pills);
            
            expect(pills[0].threshold).toBe(threshold);
            expect(regenerated).toBe(expression);
        });
    });
});

describe('Performance Tests', () => {
    test('should parse expressions quickly', () => {
        const expression = 'artist:match AND title:contains AND album:similarity>=0.8';
        
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            expressionToPills(expression);
        }
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(100); // Should parse 1000 expressions in <100ms
    });

    test('should generate expressions quickly', () => {
        const pills: Pill[] = [
            { id: 'pill-1', type: 'condition', field: 'artist', operation: 'match', text: 'artist:match' },
            { id: 'pill-2', type: 'combinator', combinator: 'AND', text: 'AND' },
            { id: 'pill-3', type: 'condition', field: 'title', operation: 'contains', text: 'title:contains' }
        ];
        
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            pillsToExpression(pills);
        }
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(50); // Should generate 1000 expressions in <50ms
    });

    test('should handle large pill arrays efficiently', () => {
        // Create a large array of pills
        const pills: Pill[] = [];
        for (let i = 0; i < 100; i++) {
            pills.push({
                id: `pill-${i}`,
                type: 'condition',
                field: 'artist',
                operation: 'match',
                text: 'artist:match'
            });
            if (i < 99) {
                pills.push({
                    id: `combinator-${i}`,
                    type: 'combinator',
                    combinator: 'AND',
                    text: 'AND'
                });
            }
        }

        const start = performance.now();
        const expression = pillsToExpression(pills);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(10); // Should generate large expression in <10ms
        expect(expression).toBeTruthy();
        expect(expression.split('AND')).toHaveLength(100); // Should have 100 conditions
    });
});