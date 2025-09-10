import { describe, it, expect } from 'vitest';
import { validateExpression } from '../../validation/validateExpression';

describe('validateExpression - Performance & Security', () => {
    describe('performance', () => {
        it('should handle moderately complex expressions efficiently', () => {
            const complexExpression = 'artist:match AND title:contains OR album:similarity>=0.8 AND artistWithTitle:is OR artistInTitle:not';
      
            const start = performance.now();
            const result = validateExpression(complexExpression);
            const end = performance.now();

            expect(result.valid).toBe(true);
            expect(end - start).toBeLessThan(10); // Should complete in under 10ms
        });

        it('should handle many validation calls efficiently', () => {
            const expressions = Array.from({ length: 1000 }, (_, i) => `artist:match AND title${i % 10}:contains`);
      
            const start = performance.now();
            expressions.forEach(expr => validateExpression(expr));
            const end = performance.now();

            expect(end - start).toBeLessThan(1000); // Should complete all 1000 in under 1 second
        });

        it('should handle deeply nested validation without performance degradation', () => {
            // Create progressively longer expressions to test scaling
            const baseSizes = [5, 10, 25, 50];
            const results: number[] = [];

            baseSizes.forEach(size => {
                const expression = Array.from({ length: size }, () => 
                    'artist:match'
                ).join(' AND ');

                const start = performance.now();
                validateExpression(expression);
                const end = performance.now();
                
                results.push(end - start);
            });

            // Validate that performance scales reasonably (not exponentially)
            expect(results).toHaveLength(4);
            expect(results[3]).toBeDefined();
            expect(results[0]).toBeDefined();
            expect(results[3]!).toBeLessThan(results[0]! * 20); // 50 conditions shouldn't be >20x slower than 5
        });
    });

    describe('security and robustness', () => {
        it('should handle potential ReDoS (Regular Expression Denial of Service) patterns', () => {
            // Test expressions that could potentially cause regex catastrophic backtracking
            const potentialReDoSPatterns = [
                `${'a'.repeat(1000)}:match`,
                `artist:${'x'.repeat(1000)}`,
                `artist:match AND ${'title:contains OR '.repeat(100)}album:is`,
                `artist:similarity>=${'0.'.repeat(100)}5`
            ];

            potentialReDoSPatterns.forEach(pattern => {
                const start = performance.now();
                const result = validateExpression(pattern);
                const end = performance.now();

                // Should complete in reasonable time even with pathological input
                expect(end - start).toBeLessThan(100); // Under 100ms
                expect(typeof result).toBe('object');
                expect(typeof result.valid).toBe('boolean');
                expect(Array.isArray(result.errors)).toBe(true);
            });
        });

        it('should sanitize and handle injection-like patterns safely', () => {
            const injectionPatterns = [
                'artist:match\'); DROP TABLE users; --',
                'artist:match<script>alert("xss")</script>',
                'artist:match${process.exit(1)}',
                'artist:match`rm -rf /`',
                String.raw`artist:match\x00\x01\x02`,
                'artist:match\u0000\u0001\u0002'
            ];

            injectionPatterns.forEach(pattern => {
                const result = validateExpression(pattern);
                // Should not throw an error, should handle gracefully
                expect(typeof result).toBe('object');
                expect(result.valid).toBe(false); // These should be invalid
            });
        });

        it('should handle extremely large expressions without memory issues', () => {
            // Test memory usage with very large but structurally valid expressions
            const largeExpression = Array.from({ length: 1000 }, () => 
                'artist:match'
            ).join(' AND ');

            const initialMemory = process.memoryUsage().heapUsed;
            const result = validateExpression(largeExpression);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            global.gc?.(); // Force garbage collection if available
            const finalMemory = process.memoryUsage().heapUsed;

            expect(result.valid).toBe(true);
            // Memory usage shouldn't increase dramatically (under 10MB for this test)
            expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024);
        });
    });
});