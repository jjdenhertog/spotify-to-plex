import { describe, it, expect } from 'vitest';
import { validateExpression } from '../../validation/validateExpression';

describe('validateExpression', () => {
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

  describe('operation validation', () => {
    const validOperations = ['match', 'contains', 'is', 'not'];

    it('should accept all valid operations', () => {
      validOperations.forEach(operation => {
        const result = validateExpression(`artist:${operation}`);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
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

  describe('error handling', () => {
    it('should handle parsing errors gracefully', () => {
      // Test with extremely malformed input that might cause parsing errors
      const result = validateExpression('artist:match AND [invalid regex (unclosed');
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return ValidationResult interface', () => {
      const result = validateExpression('artist:match');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle very long expressions', () => {
      const longExpression = Array.from({ length: 100 }, (_, i) => `field${i}:match`).join(' AND ');
      const result = validateExpression(longExpression);
      expect(result.valid).toBe(false); // Because field names are invalid
      expect(result.errors).toBeDefined();
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

  describe('edge cases', () => {
    it('should handle single character inputs', () => {
      const result = validateExpression('a');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Invalid field: "a"'));
    });

    it('should handle expressions with only operators', () => {
      const result = validateExpression('AND OR');
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid expression syntax'))).toBe(true);
    });

    it('should handle expressions with only colons', () => {
      const result = validateExpression(':::');
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid expression syntax'))).toBe(true);
    });

    it('should handle unicode characters', () => {
      const result = validateExpression('artist🎵:match');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Invalid field'));
    });
  });

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
  });

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

    it('should provide helpful error messages', () => {
      const result = validateExpression('badField:invalidOp AND artist');
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('badField'))).toBe(true);
      expect(result.errors.some(error => error.includes('invalidOp'))).toBe(true);
    });
  });
});