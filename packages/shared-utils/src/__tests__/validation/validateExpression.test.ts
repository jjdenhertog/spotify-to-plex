// Main test suite has been split into multiple files for better maintainability:
// - validateExpression.basic.test.ts - Basic validation and field tests
// - validateExpression.operations.test.ts - Operation validation tests
// - validateExpression.boolean.test.ts - Boolean operator tests
// - validateExpression.structure.test.ts - Expression structure tests  
// - validateExpression.edge-cases.test.ts - Edge cases and error handling
// - validateExpression.performance.test.ts - Performance and security tests
// - validateExpression.integration.test.ts - Integration tests and error messages

// This file is kept for backward compatibility and runs a minimal smoke test
import { describe, it, expect } from 'vitest';
import { validateExpression } from '../../validation/validateExpression';

describe('validateExpression - Smoke Tests', () => {
    it('should validate a basic expression', () => {
        const result = validateExpression('artist:match');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject an invalid expression', () => {
        const result = validateExpression('invalid:badop');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty input', () => {
        const result = validateExpression('');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Expression cannot be empty');
    });
});