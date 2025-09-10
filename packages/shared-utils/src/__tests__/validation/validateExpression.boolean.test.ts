import { describe, it, expect } from 'vitest';
import { validateExpression } from '../../validation/validateExpression';

describe('validateExpression - Boolean Operators', () => {
    describe('boolean operator validation', () => {
        it('should accept AND operator', () => {
            const result = validateExpression('artist:match AND title:contains');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should accept OR operator', () => {
            const result = validateExpression('artist:match OR title:contains');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid boolean operators', () => {
            const result = validateExpression('artist:match BUT title:contains');
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(expect.stringContaining('Invalid operators: BUT'));
        });

        it('should reject all invalid boolean operators comprehensively', () => {
            const invalidOperators = ['BUT', 'XOR', 'NOR', 'NAND', 'but', 'xor', 'nor', 'nand'];
            invalidOperators.forEach(op => {
                const result = validateExpression(`artist:match ${op} title:contains`);
                expect(result.valid).toBe(false);
                expect(result.errors.some(error => error.includes('Invalid operators')));
            });
        });

        it('should handle mixed case invalid operators', () => {
            const mixedCaseOps = ['But', 'Xor', 'Nor', 'NAND'];
            mixedCaseOps.forEach(op => {
                const result = validateExpression(`artist:match ${op} title:contains`);
                expect(result.valid).toBe(false);
            });
        });

        it('should detect multiple invalid operators in single expression', () => {
            const result = validateExpression('artist:match BUT title:contains XOR album:is');
            expect(result.valid).toBe(false);
            expect(result.errors.some(error => error.includes('BUT') && error.includes('XOR'))).toBe(true);
        });

        it('should handle multiple boolean operators', () => {
            const result = validateExpression('artist:match AND title:contains OR album:is');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should be case sensitive for operators', () => {
            const result = validateExpression('artist:match and title:contains');
            expect(result.valid).toBe(false);
            expect(result.errors.some(error => error.includes('Invalid expression syntax'))).toBe(true);
        });
    });
});