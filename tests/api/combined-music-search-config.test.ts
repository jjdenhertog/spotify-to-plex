/**
 * @file Combined Music Search Config API Route Tests
 * @description Tests for /api/plex/music-search-config/combined endpoint - Combined configuration management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import handler from '../../apps/web/pages/api/plex/music-search-config/combined';
import { 
  createMockRequestResponse, 
  createMockAxiosResponse,
  createMockAxiosError
} from '../../apps/web/__tests__/api/api-test-helpers';

// Helper function for response validation
function expectResponse(res: any, expectedStatus: number, expectedData?: any) {
  expect(res._getStatusCode()).toBe(expectedStatus);
  
  if (expectedData !== undefined) {
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual(expectedData);
  }
}

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('/api/plex/music-search-config/combined - Combined Configuration Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET requests - Fetch combined configuration', () => {
    it('should return combined text processing and search approaches configuration', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const mockTextProcessingConfig = {
        removeFeaturingArtists: true,
        filterOutWords: ['live', 'remix'],
        enableFuzzyMatching: true
      };

      const mockSearchApproachesConfig = {
        primaryApproach: 'exact',
        fallbackApproaches: ['fuzzy', 'partial'],
        maxRetries: 3
      };

      vi.mocked(mockedAxios.get)
        .mockResolvedValueOnce(createMockAxiosResponse(mockTextProcessingConfig))
        .mockResolvedValueOnce(createMockAxiosResponse(mockSearchApproachesConfig));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        textProcessing: mockTextProcessingConfig,
        searchApproaches: mockSearchApproachesConfig
      });

      // Verify both endpoints were called in parallel
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'http://localhost:3000/api/plex/music-search-config/text-processing'
      );
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'http://localhost:3000/api/plex/music-search-config/search-approaches'
      );
    });

    it('should handle first endpoint failure gracefully', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      vi.mocked(mockedAxios.get)
        .mockRejectedValueOnce(createMockAxiosError('Text processing config not found', 404))
        .mockResolvedValueOnce(createMockAxiosResponse({}));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        error: 'Internal server error',
        message: 'Text processing config not found'
      });
    });

    it('should handle second endpoint failure gracefully', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      vi.mocked(mockedAxios.get)
        .mockResolvedValueOnce(createMockAxiosResponse({}))
        .mockRejectedValueOnce(createMockAxiosError('Search approaches config not found', 404));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        error: 'Internal server error',
        message: 'Search approaches config not found'
      });
    });

    it('should handle both endpoints failure', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      vi.mocked(mockedAxios.get)
        .mockRejectedValueOnce(createMockAxiosError('First endpoint failed', 500))
        .mockRejectedValueOnce(createMockAxiosError('Second endpoint failed', 500));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        error: 'Internal server error',
        message: 'First endpoint failed'
      });
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const timeoutError = new Error('Network timeout') as any;
      timeoutError.code = 'ETIMEDOUT';
      
      vi.mocked(mockedAxios.get).mockRejectedValue(timeoutError);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
      expect(responseData.message).toBe('Network timeout');
    });

    it('should handle empty responses from both endpoints', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      vi.mocked(mockedAxios.get)
        .mockResolvedValueOnce(createMockAxiosResponse(null))
        .mockResolvedValueOnce(createMockAxiosResponse(null));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        textProcessing: null,
        searchApproaches: null
      });
    });
  });

  describe('POST requests - Update combined configuration', () => {
    it('should update both configurations successfully', async () => {
      // Arrange
      const combinedConfig = {
        textProcessing: {
          removeFeaturingArtists: false,
          filterOutWords: ['acoustic'],
          enableFuzzyMatching: false
        },
        searchApproaches: {
          primaryApproach: 'fuzzy',
          fallbackApproaches: ['exact'],
          maxRetries: 5
        }
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: combinedConfig
      });
      
      const updatedTextProcessing = { ...combinedConfig.textProcessing, updated: true };
      const updatedSearchApproaches = { ...combinedConfig.searchApproaches, updated: true };

      vi.mocked(mockedAxios.post)
        .mockResolvedValueOnce(createMockAxiosResponse(updatedTextProcessing))
        .mockResolvedValueOnce(createMockAxiosResponse(updatedSearchApproaches));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        success: true,
        message: 'Combined configuration updated successfully',
        textProcessing: updatedTextProcessing,
        searchApproaches: updatedSearchApproaches
      });

      // Verify both endpoints were called with correct data
      expect(vi.mocked(mockedAxios.post)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(mockedAxios.post)).toHaveBeenCalledWith(
        'http://localhost:3000/api/plex/music-search-config/text-processing',
        combinedConfig.textProcessing
      );
      expect(vi.mocked(mockedAxios.post)).toHaveBeenCalledWith(
        'http://localhost:3000/api/plex/music-search-config/search-approaches',
        combinedConfig.searchApproaches
      );
    });

    it('should return 400 when textProcessing is missing from request body', async () => {
      // Arrange
      const invalidConfig = {
        searchApproaches: {
          primaryApproach: 'exact',
          fallbackApproaches: ['fuzzy'],
          maxRetries: 3
        }
        // textProcessing is missing
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: invalidConfig
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request body - must contain textProcessing and searchApproaches'
      });

      expect(vi.mocked(mockedAxios.post)).not.toHaveBeenCalled();
    });

    it('should return 400 when searchApproaches is missing from request body', async () => {
      // Arrange
      const invalidConfig = {
        textProcessing: {
          removeFeaturingArtists: true,
          filterOutWords: ['live'],
          enableFuzzyMatching: true
        }
        // searchApproaches is missing
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: invalidConfig
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request body - must contain textProcessing and searchApproaches'
      });

      expect(vi.mocked(mockedAxios.post)).not.toHaveBeenCalled();
    });

    it('should return 400 when both configurations are missing', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: {}
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request body - must contain textProcessing and searchApproaches'
      });
    });

    it('should handle null/undefined request body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: null
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, {
        error: 'Invalid request body - must contain textProcessing and searchApproaches'
      });
    });

    it('should handle first endpoint update failure', async () => {
      // Arrange
      const combinedConfig = {
        textProcessing: { removeFeaturingArtists: true },
        searchApproaches: { primaryApproach: 'exact' }
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: combinedConfig
      });
      
      vi.mocked(mockedAxios.post)
        .mockRejectedValueOnce(createMockAxiosError('Failed to update text processing', 500))
        .mockResolvedValueOnce(createMockAxiosResponse({}));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
      expect(responseData.message).toBe('Failed to update text processing');
    });

    it('should handle second endpoint update failure', async () => {
      // Arrange
      const combinedConfig = {
        textProcessing: { removeFeaturingArtists: true },
        searchApproaches: { primaryApproach: 'exact' }
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: combinedConfig
      });
      
      vi.mocked(mockedAxios.post)
        .mockResolvedValueOnce(createMockAxiosResponse({}))
        .mockRejectedValueOnce(createMockAxiosError('Failed to update search approaches', 500));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
      expect(responseData.message).toBe('Failed to update search approaches');
    });

    it('should handle complex nested configuration objects', async () => {
      // Arrange
      const complexConfig = {
        textProcessing: {
          removeFeaturingArtists: true,
          filterOutWords: ['live', 'remix', 'acoustic', 'unplugged'],
          enableFuzzyMatching: true,
          fuzzyThreshold: 0.8,
          normalizeText: {
            removePunctuation: true,
            toLowerCase: true,
            removeExtraSpaces: true
          }
        },
        searchApproaches: {
          primaryApproach: 'hybrid',
          fallbackApproaches: ['exact', 'fuzzy', 'partial', 'semantic'],
          maxRetries: 3,
          retryDelay: 1000,
          caching: {
            enabled: true,
            ttl: 3600
          },
          scoring: {
            exactMatch: 10,
            fuzzyMatch: 8,
            partialMatch: 5
          }
        }
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: complexConfig
      });
      
      vi.mocked(mockedAxios.post)
        .mockResolvedValueOnce(createMockAxiosResponse(complexConfig.textProcessing))
        .mockResolvedValueOnce(createMockAxiosResponse(complexConfig.searchApproaches));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.textProcessing).toEqual(complexConfig.textProcessing);
      expect(responseData.searchApproaches).toEqual(complexConfig.searchApproaches);
    });
  });

  describe('Request validation and edge cases', () => {
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

    it('should handle very large configuration objects', async () => {
      // Arrange
      const largeConfig = {
        textProcessing: {
          filterOutWords: Array.from({ length: 1000 }, (_, i) => `word${i}`),
          customRules: Array.from({ length: 500 }, (_, i) => ({
            pattern: `pattern${i}`,
            replacement: `replacement${i}`,
            enabled: true
          }))
        },
        searchApproaches: {
          fallbackApproaches: Array.from({ length: 100 }, (_, i) => `approach${i}`),
          advancedSettings: {
            complexObject: JSON.stringify({
              nested: {
                deep: {
                  data: Array.from({ length: 200 }, (_, i) => ({ id: i, value: `value${i}` }))
                }
              }
            })
          }
        }
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: largeConfig
      });
      
      vi.mocked(mockedAxios.post)
        .mockResolvedValueOnce(createMockAxiosResponse(largeConfig.textProcessing))
        .mockResolvedValueOnce(createMockAxiosResponse(largeConfig.searchApproaches));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
    });

    it('should handle concurrent requests to same endpoint', async () => {
      // Arrange - Multiple simultaneous requests
      const configs = Array.from({ length: 5 }, (_, i) => ({
        textProcessing: { setting: `value${i}` },
        searchApproaches: { approach: `method${i}` }
      }));

      const requests = configs.map(config => 
        createMockRequestResponse({ 
          method: 'POST',
          body: config
        })
      );

      // Mock responses for all concurrent requests
      configs.forEach((config, i) => {
        vi.mocked(mockedAxios.post)
          .mockResolvedValueOnce(createMockAxiosResponse(config.textProcessing))
          .mockResolvedValueOnce(createMockAxiosResponse(config.searchApproaches));
      });

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
      
      expect(vi.mocked(mockedAxios.post)).toHaveBeenCalledTimes(10); // 5 requests * 2 endpoints each
    });

    it('should handle partial success scenarios gracefully', async () => {
      // Arrange
      const config = {
        textProcessing: { removeFeaturingArtists: true },
        searchApproaches: { primaryApproach: 'exact' }
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: config
      });
      
      // First succeeds, second fails
      vi.mocked(mockedAxios.post)
        .mockResolvedValueOnce(createMockAxiosResponse(config.textProcessing))
        .mockRejectedValueOnce(createMockAxiosError('Database connection lost', 503));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
      expect(responseData.message).toBe('Database connection lost');
    });
  });
});