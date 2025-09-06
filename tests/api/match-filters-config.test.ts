/**
 * @file Match Filters Config API Route Tests
 * @description Tests for /api/plex/music-search-config/match-filters endpoint - Match filters configuration management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import handler from '../../apps/web/pages/api/plex/music-search-config/match-filters';
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

// Mock dependencies
const mockGetMatchFilters = vi.fn();
const mockUpdateMatchFilters = vi.fn();
const mockGetStorageDir = vi.fn();

vi.mock('@spotify-to-plex/music-search/functions/getMatchFilters', () => ({
  getMatchFilters: mockGetMatchFilters
}));

vi.mock('@spotify-to-plex/music-search/functions/updateMatchFilters', () => ({
  updateMatchFilters: mockUpdateMatchFilters
}));

vi.mock('@spotify-to-plex/shared-utils/utils/getStorageDir', () => ({
  getStorageDir: mockGetStorageDir
}));

describe('/api/plex/music-search-config/match-filters - Match Filters Configuration', () => {
  const mockStorageDir = '/mock/storage/dir';

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStorageDir.mockReturnValue(mockStorageDir);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET requests - Fetch match filters', () => {
    it('should return current match filters successfully', async () => {
      // Arrange
      const mockFilters: MatchFilterConfig[] = [
        'artist:match AND title:contains',
        'album:similarity>=0.8',
        'artistWithTitle:match'
      ];

      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockGetMatchFilters.mockResolvedValue(mockFilters);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual([...mockFilters]);
      
      expect(mockGetMatchFilters).toHaveBeenCalledWith(mockStorageDir);
    });

    it('should return empty array when no filters are configured', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockGetMatchFilters.mockResolvedValue([]);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual([]);
    });

    it('should handle storage read errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockGetMatchFilters.mockRejectedValue(new Error('Failed to read filters file'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        error: 'Failed to load match filters',
        details: 'Failed to read filters file'
      });
    });

    it('should handle storage directory access errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const permissionError = new Error('EACCES: permission denied') as any;
      permissionError.code = 'EACCES';
      mockGetMatchFilters.mockRejectedValue(permissionError);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to load match filters');
      expect(responseData.details).toBe('EACCES: permission denied');
    });

    it('should handle corrupted filter file gracefully', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockGetMatchFilters.mockRejectedValue(new Error('Invalid JSON in filters file'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to load match filters');
      expect(responseData.details).toBe('Invalid JSON in filters file');
    });
  });

  describe('POST requests - Update match filters', () => {
    it('should update match filters successfully with valid expressions', async () => {
      // Arrange
      const newFilters: MatchFilterConfig[] = [
        'artist:match AND title:contains',
        'album:similarity>=0.9 OR artistInTitle:match',
        'title:match'
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: newFilters
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        success: true,
        message: 'Match filters updated successfully',
        filters: newFilters
      });
      
      expect(mockUpdateMatchFilters).toHaveBeenCalledWith(mockStorageDir, newFilters);
    });

    it('should handle empty filters array', async () => {
      // Arrange
      const emptyFilters: MatchFilterConfig[] = [];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: emptyFilters
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.filters).toEqual([]);
    });

    it('should validate filter expressions and reject invalid ones', async () => {
      // Arrange
      const invalidFilters = [
        'invalid_field:match', // Invalid field
        'artist:invalid_operation', // Invalid operation
        '', // Empty filter
        'artist AND title' // Missing operations
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: invalidFilters
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toContain('invalid expression format');
      
      expect(mockUpdateMatchFilters).not.toHaveBeenCalled();
    });

    it('should reject non-array input', async () => {
      // Arrange
      const invalidInput = { not: 'an array' };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: invalidInput
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toBe('Filters must be an array');
      
      expect(mockUpdateMatchFilters).not.toHaveBeenCalled();
    });

    it('should reject null or undefined body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: null
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toBe('Filters must be an array');
    });

    it('should validate individual filter types in array', async () => {
      // Arrange
      const mixedTypeFilters = [
        'artist:match', // Valid string
        123, // Invalid number
        null, // Invalid null
        { filter: 'object' }, // Invalid object
        'title:contains' // Valid string
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: mixedTypeFilters
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toContain('must be a string expression');
    });

    it('should reject empty string filters', async () => {
      // Arrange
      const filtersWithEmptyStrings = [
        'artist:match',
        '   ', // Whitespace only
        '', // Empty string
        'title:contains'
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: filtersWithEmptyStrings
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toContain('cannot be empty');
    });

    it('should handle complex valid expressions', async () => {
      // Arrange
      const complexFilters: MatchFilterConfig[] = [
        'artist:match AND title:contains AND album:similarity>=0.8',
        '(artistWithTitle:match OR artistInTitle:match) AND title:contains',
        'artist:similarity>=0.9 OR (title:match AND album:match)'
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: complexFilters
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.filters).toEqual(complexFilters);
    });

    it('should handle storage write errors', async () => {
      // Arrange
      const validFilters: MatchFilterConfig[] = ['artist:match'];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: validFilters
      });
      
      mockUpdateMatchFilters.mockRejectedValue(new Error('Failed to write to storage'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        error: 'Failed to update match filters',
        details: 'Failed to write to storage'
      });
    });

    it('should handle disk full errors during update', async () => {
      // Arrange
      const validFilters: MatchFilterConfig[] = ['artist:match'];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: validFilters
      });
      
      const diskFullError = new Error('ENOSPC: no space left on device') as any;
      diskFullError.code = 'ENOSPC';
      mockUpdateMatchFilters.mockRejectedValue(diskFullError);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to update match filters');
      expect(responseData.details).toBe('ENOSPC: no space left on device');
    });
  });

  describe('Expression validation edge cases', () => {
    it('should validate all supported field types', async () => {
      // Arrange
      const validFieldTypes: MatchFilterConfig[] = [
        'artist:match',
        'title:contains', 
        'album:similarity>=0.7',
        'artistWithTitle:match',
        'artistInTitle:contains'
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: validFieldTypes
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateMatchFilters).toHaveBeenCalledWith(mockStorageDir, validFieldTypes);
    });

    it('should validate all supported operation types', async () => {
      // Arrange
      const validOperations: MatchFilterConfig[] = [
        'artist:match',
        'title:contains',
        'album:similarity>=0.5',
        'artist:similarity>=0.99',
        'title:similarity>=1.0'
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: validOperations
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle incomplete expressions (field only)', async () => {
      // Arrange - According to code, operations are optional
      const incompleteExpressions: MatchFilterConfig[] = [
        'artist',
        'title', 
        'album'
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: incompleteExpressions
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateMatchFilters).toHaveBeenCalledWith(mockStorageDir, incompleteExpressions);
    });

    it('should validate similarity thresholds', async () => {
      // Arrange
      const similarityFilters: MatchFilterConfig[] = [
        'artist:similarity>=0.0', // Min valid
        'title:similarity>=0.5', // Mid range
        'album:similarity>=1.0', // Max valid
        'artist:similarity>=0.75' // Decimal
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: similarityFilters
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle very large filter arrays', async () => {
      // Arrange
      const largeFilterArray: MatchFilterConfig[] = Array.from({ length: 1000 }, (_, i) => 
        `artist:similarity>=${(i % 100) / 100}`
      );

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: largeFilterArray
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateMatchFilters).toHaveBeenCalledWith(mockStorageDir, largeFilterArray);
    });
  });

  describe('Request validation and error handling', () => {
    it('should return 405 for unsupported HTTP methods', async () => {
      // Test PUT
      const { req: putReq, res: putRes } = createMockRequestResponse({ method: 'PUT' });
      await handler(putReq, putRes);
      expectResponse(putRes, 405, { error: 'Method not allowed' });

      // Test DELETE  
      const { req: delReq, res: delRes } = createMockRequestResponse({ method: 'DELETE' });
      await handler(delReq, delRes);
      expectResponse(delRes, 405, { error: 'Method not allowed' });

      // Test PATCH
      const { req: patchReq, res: patchRes } = createMockRequestResponse({ method: 'PATCH' });
      await handler(patchReq, patchRes);
      expectResponse(patchRes, 405, { error: 'Method not allowed' });
    });

    it('should handle concurrent filter updates', async () => {
      // Arrange - Multiple simultaneous update requests
      const updates = [
        ['artist:match', 'title:contains'],
        ['album:similarity>=0.8'],
        ['artistWithTitle:match', 'artistInTitle:contains', 'title:match']
      ];

      const requests = updates.map(filters => 
        createMockRequestResponse({ 
          method: 'POST',
          body: filters
        })
      );

      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      const responses = await Promise.all(
        requests.map(({ req, res }) => 
          handler(req, res).then(() => res).catch(() => res)
        )
      );

      // Assert
      responses.forEach(res => {
        expect(res._getStatusCode()).toBe(200);
        
        const responseData = JSON.parse(res._getData());
        expect(responseData.success).toBe(true);
      });
      
      expect(mockUpdateMatchFilters).toHaveBeenCalledTimes(3);
    });

    it('should handle storage directory initialization', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      // Mock storage directory doesn't exist initially
      mockGetStorageDir.mockReturnValue('/new/storage/dir');
      mockGetMatchFilters.mockResolvedValue([]);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(mockGetMatchFilters).toHaveBeenCalledWith('/new/storage/dir');
    });

    it('should maintain filter order during updates', async () => {
      // Arrange
      const orderedFilters: MatchFilterConfig[] = [
        'title:match',
        'artist:contains', 
        'album:similarity>=0.9',
        'artistWithTitle:match'
      ];

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: orderedFilters
      });
      
      mockUpdateMatchFilters.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.filters).toEqual(orderedFilters); // Exact order maintained
      expect(mockUpdateMatchFilters).toHaveBeenCalledWith(mockStorageDir, orderedFilters);
    });
  });
});