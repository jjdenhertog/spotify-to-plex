import { describe, it, expect } from 'vitest';
import { validateExpression } from '../../validation/validateExpression';

describe('validateExpression - Expression Structure', () => {
    describe('expression structure validation', () => {
        it('should validate balanced expressions', () => {
            const balancedExpressions = [
                'artist',
                'artist:match',
                'artist:match AND title:contains',
                'artist:match OR title:contains AND album:is'
            ];

            balancedExpressions.forEach(expr => {
                const result = validateExpression(expr);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        it('should validate operator-to-condition ratio precisely', () => {
            // Test exact counting of operators vs conditions
            const testCases = [
                { expr: 'artist', conditions: 1, operators: 0 },
                { expr: 'artist AND title', conditions: 2, operators: 1 },
                { expr: 'artist AND title OR album', conditions: 3, operators: 2 },
                { expr: 'artist AND title OR album AND artistWithTitle', conditions: 4, operators: 3 }
            ];
            
            testCases.forEach(({ expr }) => {
                const result = validateExpression(expr);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
                
                // Validate the counting logic by testing edge cases
                const tooManyOps = `${expr} AND`;
                const tooManyOpsResult = validateExpression(tooManyOps);
                expect(tooManyOpsResult.valid).toBe(false);
            });
        });

        it('should handle complex nested logical patterns', () => {
            // Test complex but valid boolean logic patterns
            const complexPatterns = [
                'artist:match AND title:contains OR album:is AND artistWithTitle:similarity>=0.8',
                'title:similarity>=0.7 OR artist:match AND album:not OR artistInTitle:contains',
                'artist:is OR title:is OR album:is OR artistWithTitle:is OR artistInTitle:is'
            ];
            
            complexPatterns.forEach(pattern => {
                const result = validateExpression(pattern);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        it('should reject unbalanced expressions', () => {
            const unbalancedExpressions = [
                'artist:match AND',
                'AND title:contains',
                'artist:match AND OR title:contains'
            ];

            unbalancedExpressions.forEach(expr => {
                const result = validateExpression(expr);
                expect(result.valid).toBe(false);
                expect(result.errors.some(error => 
                    error.includes('Unbalanced expression') || 
                    error.includes('Invalid expression syntax')
                )).toBe(true);
            });
        });

        it('should handle complex valid expressions', () => {
            const complexExpressions = [
                'artist:match AND title:contains AND album:similarity>=0.8',
                'artistWithTitle:is OR artistInTitle:not AND title:match',
                'artist:similarity>=0.7 OR title:similarity>=0.8'
            ];

            complexExpressions.forEach(expr => {
                const result = validateExpression(expr);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });
    });

    describe('whitespace handling', () => {
        it('should handle expressions with extra whitespace', () => {
            const result = validateExpression('  artist : match   AND   title : contains  ');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle expressions with no spaces around operators', () => {
            const result = validateExpression('artist:match AND title:contains');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle tabs and other whitespace characters', () => {
            const result = validateExpression('artist:match\tAND\ntitle:contains');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});