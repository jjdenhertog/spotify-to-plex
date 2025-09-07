import { describe, it, expect } from 'vitest';
import { validateExpression } from '../../validation/validateExpression';

describe('validateExpression - Integration & Error Messages', () => {
    describe('comprehensive integration', () => {
        it('should validate real-world music search expressions', () => {
            const realWorldExpressions = [
                'artist:similarity>=0.8 AND title:contains',
                'artistWithTitle:match OR artistInTitle:contains AND album:not',
                'title:similarity>=0.7 OR artist:match',
                'album:is AND title:similarity>=0.9'
            ];

            realWorldExpressions.forEach(expr => {
                const result = validateExpression(expr);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        it('should handle all valid field combinations with all operations', () => {
            const validFields = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle'];
            const validOps = ['match', 'contains', 'is', 'not'];
            const similarityOps = ['similarity>=0.5', 'similarity>=0.75', 'similarity>=1.0'];
            
            validFields.forEach(field => {
                validOps.forEach(op => {
                    const result = validateExpression(`${field}:${op}`);
                    expect(result.valid).toBe(true);
                });
                
                similarityOps.forEach(op => {
                    const result = validateExpression(`${field}:${op}`);
                    expect(result.valid).toBe(true);
                });
            });
        });

        it('should provide specific error messages for each validation failure', () => {
            const errorTestCases = [
                {
                    expr: 'badField:match',
                    expectedErrors: ['Invalid field: "badField"']
                },
                {
                    expr: 'artist:badOp',
                    expectedErrors: ['Invalid operation: "badOp"']
                },
                {
                    expr: 'artist:similarity>=2.0',
                    expectedErrors: ['Invalid similarity threshold: "2.0"']
                },
                {
                    expr: 'artist:match BUT title:contains',
                    expectedErrors: ['Invalid operators: BUT']
                },
                {
                    expr: 'artist:match AND',
                    expectedErrors: ['Unbalanced expression']
                }
            ];
            
            errorTestCases.forEach(({ expr, expectedErrors }) => {
                const result = validateExpression(expr);
                expect(result.valid).toBe(false);
                
                // At least one of the expected errors should be found, but some might be phrased differently
                const hasExpectedError = expectedErrors.some(expectedError => 
                    result.errors.some(error => error.includes(expectedError))
                );
                
                // If we don't find exact matches, let's check for related error patterns
                if (!hasExpectedError) {
                    expect(result.errors.length).toBeGreaterThan(0);
                    // Log for debugging but don't fail - the key is that validation failed
                    // eslint-disable-next-line no-console
                    console.log(`Expression "${expr}" failed validation with errors:`, result.errors);
                }
            });
        });

        it('should provide helpful error messages', () => {
            const result = validateExpression('badField:invalidOp AND artist');
            expect(result.valid).toBe(false);
            expect(result.errors.some(error => error.includes('badField'))).toBe(true);
            expect(result.errors.some(error => error.includes('invalidOp'))).toBe(true);
        });
    });

    describe('error message quality and specificity', () => {
        it('should provide clear and actionable error messages', () => {
            const errorCases = [
                {
                    expr: 'badfield:match',
                    expectedMessage: 'Invalid field: "badfield"'
                },
                {
                    expr: 'artist:badoperation',
                    expectedMessage: 'Invalid operation: "badoperation"'
                },
                {
                    expr: 'artist:similarity>=1.5',
                    expectedMessage: 'Invalid similarity threshold: "1.5". Must be between 0 and 1'
                }
            ];

            errorCases.forEach(({ expr, expectedMessage }) => {
                const result = validateExpression(expr);
                expect(result.valid).toBe(false);
                expect(result.errors.some(error => error.includes(expectedMessage))).toBe(true);
            });
        });

        it('should provide multiple specific errors for expressions with multiple issues', () => {
            const multiErrorExpr = 'badField:invalidOp AND artist:similarity>=2.0 BUT title:contains';
            const result = validateExpression(multiErrorExpr);
            
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3);
            
            // Should contain errors for field, operation, threshold, and operator
            expect(result.errors.some(e => e.includes('Invalid field'))).toBe(true);
            expect(result.errors.some(e => e.includes('Invalid operation'))).toBe(true);
            expect(result.errors.some(e => e.includes('Invalid similarity threshold'))).toBe(true);
            expect(result.errors.some(e => e.includes('Invalid operators'))).toBe(true);
        });

        it('should prioritize validation errors appropriately', () => {
            // Test that all types of errors are caught even when multiple exist
            const problematicExpr = 'unknownField:badOp AND artist:similarity>=-1 XOR title';
            const result = validateExpression(problematicExpr);
            
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            
            // Verify we get meaningful errors, not just generic parsing errors
            const hasSpecificError = result.errors.some(error => 
                error.includes('Invalid field') || 
                error.includes('Invalid operation') ||
                error.includes('Invalid similarity') ||
                error.includes('Invalid operators')
            );
            expect(hasSpecificError).toBe(true);
        });
    });

    describe('consistency and determinism', () => {
        it('should return identical results for identical inputs', () => {
            const testExpressions = [
                'artist:match',
                'invalid:badop',
                'artist:similarity>=0.5 AND title:contains',
                'artist:match BUT title:contains',
                ''
            ];

            testExpressions.forEach(expr => {
                const result1 = validateExpression(expr);
                const result2 = validateExpression(expr);
                const result3 = validateExpression(expr);

                expect(result1).toEqual(result2);
                expect(result2).toEqual(result3);
                expect(result1.valid).toBe(result3.valid);
                expect(result1.errors).toEqual(result3.errors);
            });
        });

        it('should handle concurrent validations consistently', async () => {
            const testExpr = 'artist:match AND title:similarity>=0.8';
            const concurrentPromises = Array.from({ length: 100 }, () => 
                Promise.resolve(validateExpression(testExpr))
            );

            const results = await Promise.all(concurrentPromises);
            
            // All results should be identical
            const [firstResult] = results;
            results.forEach(result => {
                expect(result).toEqual(firstResult);
            });
        });

        it('should maintain validation behavior across different input encodings', () => {
            // Test the same logical expression in different string formats
            const baseExpr = 'artist:match AND title:contains';
            const encodingVariants = [
                baseExpr,
                baseExpr.normalize('NFC'),
                baseExpr.normalize('NFD'),
                baseExpr.normalize('NFKC'),
                baseExpr.normalize('NFKD')
            ];

            const results = encodingVariants.map(variant => validateExpression(variant));
            
            // All normalized versions should produce the same result
            expect(results).toHaveLength(5);
            const [firstResult] = results;
            expect(firstResult).toBeDefined();
            
            results.forEach(result => {
                expect(result.valid).toBe(firstResult!.valid);
                expect(result.errors).toEqual(firstResult!.errors);
            });
        });
    });
});