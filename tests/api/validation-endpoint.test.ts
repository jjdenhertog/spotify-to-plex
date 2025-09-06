/**
 * @file Validation API Route Tests
 * @description Tests for /api/plex/music-search-config/validate endpoint - Expression and filter validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import handler from '../../apps/web/pages/api/plex/music-search-config/validate';
import { 
  createMockRequestResponse
} from '../../apps/web/__tests__/api/api-test-helpers';

// Helper function for response validation
function expectResponse(res: any, expectedStatus: number, expectedData?: any) {
  expect(res._getStatusCode()).toBe(expectedStatus);
  
  if (expectedData !== undefined) {
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual(expectedData);
  }
}
import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';
import { validateExpression } from '@spotify-to-plex/shared-utils/validation/validateExpression';
import { getMatchFilterValidationErrors } from '@spotify-to-plex/shared-utils/validation/getMatchFilterValidationErrors';
import { migrateLegacyFilter } from '@spotify-to-plex/music-search/functions/parseExpression';

// Mock dependencies using proper Vitest pattern
vi.mock('@spotify-to-plex/shared-utils/validation/validateExpression');
vi.mock('@spotify-to-plex/shared-utils/validation/getMatchFilterValidationErrors');
vi.mock('@spotify-to-plex/music-search/functions/parseExpression');

// Get references to mocked functions after imports
const mockValidateExpression = vi.mocked(validateExpression);
const mockGetMatchFilterValidationErrors = vi.mocked(getMatchFilterValidationErrors);
const mockMigrateLegacyFilter = vi.mocked(migrateLegacyFilter);

describe('/api/plex/music-search-config/validate - Validation Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Method validation', () => {
    it('should only accept POST requests', async () => {
      // Test GET
      const { req: getReq, res: getRes } = createMockRequestResponse({ method: 'GET' });
      await handler(getReq, getRes);
      expectResponse(getRes, 405, {
        error: 'Method not allowed',
        details: ['Only POST method is supported for validation']
      });

      // Test PUT
      const { req: putReq, res: putRes } = createMockRequestResponse({ method: 'PUT' });
      await handler(putReq, putRes);
      expectResponse(putRes, 405, {
        error: 'Method not allowed',
        details: ['Only POST method is supported for validation']
      });

      // Test DELETE
      const { req: delReq, res: delRes } = createMockRequestResponse({ method: 'DELETE' });
      await handler(delReq, delRes);
      expectResponse(delRes, 405, {
        error: 'Method not allowed',
        details: ['Only POST method is supported for validation']
      });
    });
  });

  describe('Expression validation', () => {
    it('should validate valid expression syntax', async () => {
      // Arrange
      const validExpression = 'artist:match AND title:contains';
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: validExpression }
      });

      mockValidateExpression.mockReturnValue({
        valid: true,
        errors: []
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        valid: true,
        errors: [],
        expression: validExpression
      });

      expect(mockValidateExpression).toHaveBeenCalledWith(validExpression);
    });

    it('should validate invalid expression syntax', async () => {
      // Arrange
      const invalidExpression = 'invalid_field:unknown_operation';
      const validationErrors = [
        'Invalid field: invalid_field',
        'Invalid operation: unknown_operation'
      ];

      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: invalidExpression }
      });

      mockValidateExpression.mockReturnValue({
        valid: false,
        errors: validationErrors
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        valid: false,
        errors: validationErrors,
        expression: invalidExpression
      });
    });

    it('should reject non-string expression', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: 123 }
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request',
        details: ['Expression must be a string']
      });

      expect(mockValidateExpression).not.toHaveBeenCalled();
    });

    it('should handle empty string expression', async () => {
      // Arrange
      const emptyExpression = '';
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: emptyExpression }
      });

      mockValidateExpression.mockReturnValue({
        valid: false,
        errors: ['Expression cannot be empty']
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.valid).toBe(false);
      expect(responseData.errors).toContain('Expression cannot be empty');
    });

    it('should handle complex valid expressions', async () => {
      // Arrange
      const complexExpression = '(artist:match OR artistWithTitle:contains) AND (title:similarity>=0.8 OR album:match)';
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: complexExpression }
      });

      mockValidateExpression.mockReturnValue({
        valid: true,
        errors: []
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.valid).toBe(true);
      expect(responseData.expression).toBe(complexExpression);
    });

    it('should handle whitespace-only expression', async () => {
      // Arrange
      const whitespaceExpression = '   \t\n   ';
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: whitespaceExpression }
      });

      mockValidateExpression.mockReturnValue({
        valid: false,
        errors: ['Expression cannot be empty or whitespace only']
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.valid).toBe(false);
      expect(responseData.errors).toContain('Expression cannot be empty or whitespace only');
    });
  });

  describe('Filter validation', () => {
    it('should validate complete valid filter', async () => {
      // Arrange
      const validFilter: MatchFilterConfig = 'artist:match AND title:contains';
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { filter: validFilter }
      });

      mockGetMatchFilterValidationErrors.mockReturnValue([]);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        valid: true,
        errors: [],
        filter: validFilter
      });

      expect(mockGetMatchFilterValidationErrors).toHaveBeenCalledWith(validFilter);
    });

    it('should validate complete invalid filter', async () => {
      // Arrange
      const invalidFilter: MatchFilterConfig = 'invalid:syntax';
      const validationErrors = [
        'Invalid field name: invalid',
        'Invalid syntax structure'
      ];

      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { filter: invalidFilter }
      });

      mockGetMatchFilterValidationErrors.mockReturnValue(validationErrors);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        valid: false,
        errors: validationErrors,
        filter: invalidFilter
      });
    });

    it('should handle filter with multiple validation errors', async () => {
      // Arrange
      const problematicFilter: MatchFilterConfig = 'bad_field:invalid_op AND :missing_field';
      const multipleErrors = [
        'Invalid field: bad_field',
        'Invalid operation: invalid_op', 
        'Missing field name after AND',
        'Invalid syntax: empty field'
      ];

      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { filter: problematicFilter }
      });

      mockGetMatchFilterValidationErrors.mockReturnValue(multipleErrors);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.valid).toBe(false);
      expect(responseData.errors).toEqual(multipleErrors);
      expect(responseData.errors).toHaveLength(4);
    });

    it('should handle complex valid filter configurations', async () => {
      // Arrange
      const complexFilter: MatchFilterConfig = 'artistWithTitle:similarity>=0.9 OR (artist:match AND title:contains AND album:similarity>=0.7)';
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { filter: complexFilter }
      });

      mockGetMatchFilterValidationErrors.mockReturnValue([]);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.valid).toBe(true);
      expect(responseData.filter).toBe(complexFilter);
    });
  });

  describe('Legacy filter migration', () => {
    it('should successfully migrate legacy filter', async () => {
      // Arrange
      const legacyFilter = 'old_format_filter';
      const migratedExpression = 'artist:match AND title:contains';
      
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { legacyFilter }
      });

      mockMigrateLegacyFilter.mockReturnValue(migratedExpression);
      mockValidateExpression.mockReturnValue({
        valid: true,
        errors: []
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        success: true,
        originalFilter: legacyFilter,
        migratedExpression,
        errors: undefined
      });

      expect(mockMigrateLegacyFilter).toHaveBeenCalledWith(legacyFilter);
      expect(mockValidateExpression).toHaveBeenCalledWith(migratedExpression);
    });

    it('should handle failed legacy migration', async () => {
      // Arrange
      const legacyFilter = 'unrecognized_legacy_format';
      
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { legacyFilter }
      });

      mockMigrateLegacyFilter.mockReturnValue(null);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        success: false,
        originalFilter: legacyFilter,
        migratedExpression: null,
        errors: ['Unable to migrate legacy filter - pattern not recognized']
      });

      expect(mockValidateExpression).not.toHaveBeenCalled();
    });

    it('should handle successful migration with validation errors', async () => {
      // Arrange
      const legacyFilter = 'legacy_with_issues';
      const migratedExpression = 'invalid:migrated_syntax';
      const validationErrors = ['Migrated expression has syntax errors'];
      
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { legacyFilter }
      });

      mockMigrateLegacyFilter.mockReturnValue(migratedExpression);
      mockValidateExpression.mockReturnValue({
        valid: false,
        errors: validationErrors
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        success: true,
        originalFilter: legacyFilter,
        migratedExpression,
        errors: validationErrors
      });
    });

    it('should reject non-string legacy filter', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { legacyFilter: { invalid: 'object' } }
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request',
        details: ['Legacy filter must be a string']
      });

      expect(mockMigrateLegacyFilter).not.toHaveBeenCalled();
    });

    it('should handle empty legacy filter', async () => {
      // Arrange
      const emptyLegacyFilter = '';
      
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { legacyFilter: emptyLegacyFilter }
      });

      mockMigrateLegacyFilter.mockReturnValue(null);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.originalFilter).toBe(emptyLegacyFilter);
    });
  });

  describe('Request validation and error handling', () => {
    it('should handle invalid request body format', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { invalidField: 'value' }
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request',
        details: [
          'Request body must contain one of:',
          '- { expression: string } - to validate expression syntax',
          '- { filter: MatchFilterConfig } - to validate complete filter',
          '- { legacyFilter: string } - to migrate legacy filter'
        ]
      });
    });

    it('should handle empty request body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: {}
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request',
        details: [
          'Request body must contain one of:',
          '- { expression: string } - to validate expression syntax',
          '- { filter: MatchFilterConfig } - to validate complete filter',
          '- { legacyFilter: string } - to migrate legacy filter'
        ]
      });
    });

    it('should handle null request body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: null
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request',
        details: [
          'Request body must contain one of:',
          '- { expression: string } - to validate expression syntax',
          '- { filter: MatchFilterConfig } - to validate complete filter',
          '- { legacyFilter: string } - to migrate legacy filter'
        ]
      });
    });

    it('should handle multiple fields in request body (should pick first match)', async () => {
      // Arrange - Request with multiple validation types
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { 
          expression: 'artist:match',
          filter: 'title:contains',
          legacyFilter: 'old_format'
        }
      });

      mockValidateExpression.mockReturnValue({
        valid: true,
        errors: []
      });

      // Act
      await handler(req, res);

      // Assert - Should process expression first
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('expression');
      expect(responseData).not.toHaveProperty('filter');
      expect(responseData).not.toHaveProperty('originalFilter');
      
      expect(mockValidateExpression).toHaveBeenCalledWith('artist:match');
      expect(mockGetMatchFilterValidationErrors).not.toHaveBeenCalled();
      expect(mockMigrateLegacyFilter).not.toHaveBeenCalled();
    });

    it('should handle validation function throwing errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: 'artist:match' }
      });

      mockValidateExpression.mockImplementation(() => {
        throw new Error('Validation function crashed');
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 500, {
        error: 'Internal server error',
        details: ['Validation function crashed']
      });
    });

    it('should handle migration function throwing errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { legacyFilter: 'problematic_filter' }
      });

      mockMigrateLegacyFilter.mockImplementation(() => {
        throw new Error('Migration function crashed');
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 500, {
        error: 'Internal server error',
        details: ['Migration function crashed']
      });
    });

    it('should handle very long expressions', async () => {
      // Arrange
      const veryLongExpression = Array.from({ length: 1000 }, (_, i) => 
        `field${i}:match`
      ).join(' AND ');

      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: veryLongExpression }
      });

      mockValidateExpression.mockReturnValue({
        valid: true,
        errors: []
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.valid).toBe(true);
      expect(responseData.expression).toBe(veryLongExpression);
    });

    it('should handle special characters in expressions', async () => {
      // Arrange
      const specialCharExpression = 'artist:match AND title:contains "special & characters (test)"';
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        body: { expression: specialCharExpression }
      });

      mockValidateExpression.mockReturnValue({
        valid: true,
        errors: []
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.valid).toBe(true);
      expect(responseData.expression).toBe(specialCharExpression);
    });
  });
});