import { describe, it, expect } from 'vitest';
import { validateExpression } from '../../validation/validateExpression';

describe('validateExpression - Operations Validation', () => {
    describe('operation validation', () => {
        const validOperations = ['match', 'contains', 'is', 'not'];

        it('should accept all valid operations', () => {
            validOperations.forEach(operation => {
                const result = validateExpression(`artist:${operation}`);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        it('should handle operation regex pattern with special characters', () => {
            // Test operation extraction with various spacing and characters
            const testCases = [
                'artist: match',      // space after colon
                'artist:match ',      // space after operation
                'artist:match\t',     // tab after operation
                'artist:match\n'      // newline after operation
            ];
            
            testCases.forEach(testCase => {
                const result = validateExpression(testCase);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        it('should reject operations with invalid characters', () => {
            const invalidOps = ['match!', 'contain$', 'i@s', 'no#t'];
            invalidOps.forEach(op => {
                const result = validateExpression(`artist:${op}`);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(expect.stringContaining(`Invalid operation: "${op}"`));
            });
        });

        it('should accept similarity operations with valid thresholds', () => {
            const validThresholds = ['0.5', '0.75', '1.0', '0.0', '0.123'];
            validThresholds.forEach(threshold => {
                const result = validateExpression(`artist:similarity>=${threshold}`);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        it('should handle boundary values for similarity thresholds', () => {
            const boundaryTests = [
                { threshold: '0', valid: true },
                { threshold: '1', valid: true },
                { threshold: '0.000000001', valid: true },
                { threshold: '0.999999999', valid: true },
                { threshold: '1.000000001', valid: false },
                { threshold: '-0.000000001', valid: false }
            ];
            
            boundaryTests.forEach(({ threshold, valid }) => {
                const result = validateExpression(`artist:similarity>=${threshold}`);
                expect(result.valid).toBe(valid);
                if (!valid) {
                    // Check for either specific threshold error or general operation error
                    expect(result.errors.some(error => 
                        error.includes('Invalid similarity threshold') || 
                        error.includes('Invalid operation')
                    )).toBe(true);
                }
            });
        });

        it('should validate exact similarity threshold error messages', () => {
            const result = validateExpression('artist:similarity>=1.5');
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual('Invalid similarity threshold: "1.5". Must be between 0 and 1');
        });

        it('should handle similarity operations with malformed syntax', () => {
            const malformedCases = [
                'artist:similarity>',      // Missing equals
                'artist:similarity=0.5',   // Missing greater than
                'artist:similarity<=0.5',  // Wrong operator
                'artist:similarity>=',     // Missing threshold
                'artist:similarity>= 0.5', // Space before threshold
                'artist:similarity>=0.5.0' // Invalid number format
            ];
            
            malformedCases.forEach(expr => {
                const result = validateExpression(expr);
                expect(result.valid).toBe(false);
            });
        });

        it('should reject invalid operations', () => {
            const result = validateExpression('artist:invalidOp');
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(expect.stringContaining('Invalid operation: "invalidOp"'));
        });

        it('should reject similarity operations with invalid thresholds', () => {
            const invalidThresholds = ['1.5', '-0.1', 'abc', ''];
            invalidThresholds.forEach(threshold => {
                const result = validateExpression(`artist:similarity>=${threshold}`);
                expect(result.valid).toBe(false);
                expect(result.errors.some(error => 
                    error.includes('Invalid similarity threshold') || 
                    error.includes('Invalid operation')
                )).toBe(true);
            });
        });

        it('should handle missing similarity threshold', () => {
            const result = validateExpression('artist:similarity>=');
            expect(result.valid).toBe(false);
            expect(result.errors.some(error => error.includes('Invalid'))).toBe(true);
        });
    });
});