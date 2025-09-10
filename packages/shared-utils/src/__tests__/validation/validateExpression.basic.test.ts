import { describe, it, expect } from 'vitest';
import { validateExpression } from '../../validation/validateExpression';

describe('validateExpression - Basic Validation', () => {
    describe('basic validation', () => {
        it('should return valid: false for empty expression', () => {
            const result = validateExpression('');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Expression cannot be empty');
        });

        it('should return valid: false for whitespace-only expression', () => {
            const result = validateExpression('   ');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Expression cannot be empty');
        });

        it('should return valid: true for single valid field', () => {
            const result = validateExpression('artist');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return valid: true for field with operation', () => {
            const result = validateExpression('artist:match');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('field validation', () => {
        const validFields = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle'];

        it('should accept all valid fields as standalone', () => {
            validFields.forEach(field => {
                const result = validateExpression(field);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        it('should accept all valid fields with operations', () => {
            validFields.forEach(field => {
                const result = validateExpression(`${field}:match`);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        it('should reject invalid field names', () => {
            const result = validateExpression('invalidField:match');
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(expect.stringContaining('Invalid field: "invalidField"'));
        });

        it('should reject multiple invalid fields', () => {
            const result = validateExpression('badField:match AND anotherBad:contains');
            expect(result.valid).toBe(false);
            expect(result.errors.some(error => error.includes('badField'))).toBe(true);
            expect(result.errors.some(error => error.includes('anotherBad'))).toBe(true);
        });

        it('should handle mixed valid and invalid fields', () => {
            const result = validateExpression('artist:match AND invalidField:contains');
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(expect.stringContaining('Invalid field: "invalidField"'));
        });
    });

    describe('mixed field formats', () => {
        it('should handle expressions with both field:operation and standalone fields', () => {
            const result = validateExpression('artist AND title:match');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle multiple standalone fields', () => {
            const result = validateExpression('artist AND title OR album');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle all standalone fields', () => {
            const result = validateExpression('artist OR title');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});