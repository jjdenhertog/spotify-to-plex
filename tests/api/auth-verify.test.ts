/**
 * @file Auth Verify API Route Tests
 * @description Tests for /api/auth/verify endpoint - Plex authentication verification
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import handler from '../../apps/web/pages/api/auth/verify';
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

// Mock plex library
vi.mock('@/library/plex', () => ({
  plex: {
    getSettings: vi.fn(),
    updateSettings: vi.fn()
  }
}));

// Mock error helper
vi.mock('@/helpers/errors/generateError', () => ({
  generateError: vi.fn()
}));

import { plex } from '@/library/plex';
import { generateError } from '@/helpers/errors/generateError';

const mockPlex = vi.mocked(plex);
const mockGenerateError = vi.mocked(generateError);

// Mock environment variables
const mockEnvVars = {
  PLEX_APP_ID: 'test-app-id'
};

describe('/api/auth/verify - Plex Authentication Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup environment variables
    Object.entries(mockEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    
    // Clean up environment variables
    Object.keys(mockEnvVars).forEach(key => {
      delete process.env[key];
    });
  });

  describe('POST requests - Authentication verification', () => {
    it('should verify authentication successfully with valid pin', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      const mockPlexResponse = {
        authToken: 'test-auth-token',
        code: 'test-pin-code'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockPlexResponse)
      );
      mockPlex.updateSettings.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({ ok: true });

      // Verify Plex TV API was called with correct parameters
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'https://plex.tv/api/v2/pins/test-pin-id',
        {
          params: {
            code: 'test-pin-code',
            'X-Plex-Client-Identifier': 'test-app-id'
          }
        }
      );

      // Verify settings were updated with token
      expect(mockPlex.updateSettings).toHaveBeenCalledWith({ 
        token: 'test-auth-token' 
      });
    });

    it('should return 400 when pin_id is missing', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: null,
        pin_code: 'test-pin-code'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, { error: 'No authentication pin found' });
      
      expect(vi.mocked(mockedAxios.get)).not.toHaveBeenCalled();
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
    });

    it('should return 400 when pin_code is missing', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: null
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, { error: 'No authentication pin found' });
      
      expect(vi.mocked(mockedAxios.get)).not.toHaveBeenCalled();
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
    });

    it('should return 400 when both pin_id and pin_code are missing', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: undefined,
        pin_code: undefined
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, { error: 'No authentication pin found' });
    });

    it('should handle empty string pins', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: '',
        pin_code: ''
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, { error: 'No authentication pin found' });
    });

    it('should handle Plex TV API errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('Invalid pin code', 400)
      );

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to verify authentication');
    });

    it('should handle Plex TV API unauthorized error', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'invalid-pin-id',
        pin_code: 'invalid-pin-code'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('Unauthorized', 401)
      );

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to verify authentication');
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      
      const timeoutError = new Error('Network timeout') as any;
      timeoutError.code = 'ETIMEDOUT';
      vi.mocked(mockedAxios.get).mockRejectedValue(timeoutError);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to verify authentication');
    });

    it('should handle malformed Plex TV response', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse({
          // Missing authToken field
          code: 'test-pin-code'
        })
      );

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({ ok: true });

      // Should still try to update settings even with undefined token
      expect(mockPlex.updateSettings).toHaveBeenCalledWith({ 
        token: undefined 
      });
    });

    it('should handle settings update failure', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      const mockPlexResponse = {
        authToken: 'test-auth-token'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockPlexResponse)
      );
      mockPlex.updateSettings.mockRejectedValue(new Error('Failed to save settings'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to verify authentication');
    });

    it('should handle settings read failure', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      mockPlex.getSettings.mockRejectedValue(new Error('Failed to read settings'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to verify authentication');
      
      expect(vi.mocked(mockedAxios.get)).not.toHaveBeenCalled();
    });

    it('should handle missing environment variables', async () => {
      // Arrange
      delete process.env.PLEX_APP_ID;
      
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      const mockPlexResponse = {
        authToken: 'test-auth-token'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockPlexResponse)
      );
      mockPlex.updateSettings.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert - Should still work with undefined PLEX_APP_ID
      expect(res._getStatusCode()).toBe(200);
      
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'https://plex.tv/api/v2/pins/test-pin-id',
        {
          params: {
            code: 'test-pin-code',
            'X-Plex-Client-Identifier': undefined
          }
        }
      );
    });

    it('should handle empty authToken in response', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      const mockPlexResponse = {
        authToken: '', // Empty token
        code: 'test-pin-code'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockPlexResponse)
      );
      mockPlex.updateSettings.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({ ok: true });

      expect(mockPlex.updateSettings).toHaveBeenCalledWith({ 
        token: '' 
      });
    });
  });

  describe('Request validation and edge cases', () => {
    it('should only accept POST requests', async () => {
      // Test GET
      const { req: getReq, res: getRes } = createMockRequestResponse({ method: 'GET' });
      await handler(getReq, getRes);
      expect(getRes._getStatusCode()).toBe(404);

      // Test PUT
      const { req: putReq, res: putRes } = createMockRequestResponse({ method: 'PUT' });
      await handler(putReq, putRes);
      expect(putRes._getStatusCode()).toBe(404);

      // Test DELETE
      const { req: delReq, res: delRes } = createMockRequestResponse({ method: 'DELETE' });
      await handler(delReq, delRes);
      expect(delRes._getStatusCode()).toBe(404);

      // Test PATCH
      const { req: patchReq, res: patchRes } = createMockRequestResponse({ method: 'PATCH' });
      await handler(patchReq, patchRes);
      expect(patchRes._getStatusCode()).toBe(404);
    });

    it('should handle very long pin values', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const longPinId = 'a'.repeat(1000);
      const longPinCode = 'b'.repeat(1000);
      
      const mockSettings = {
        pin_id: longPinId,
        pin_code: longPinCode
      };

      const mockPlexResponse = {
        authToken: 'test-auth-token'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockPlexResponse)
      );
      mockPlex.updateSettings.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        `https://plex.tv/api/v2/pins/${longPinId}`,
        {
          params: {
            code: longPinCode,
            'X-Plex-Client-Identifier': 'test-app-id'
          }
        }
      );
    });

    it('should handle special characters in pins', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const specialCharPinId = 'pin-with-special-chars-!@#$%^&*()';
      const specialCharPinCode = 'code-with-chars-+={}[]|\\:";\'<>?,./';
      
      const mockSettings = {
        pin_id: specialCharPinId,
        pin_code: specialCharPinCode
      };

      const mockPlexResponse = {
        authToken: 'test-auth-token'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockPlexResponse)
      );
      mockPlex.updateSettings.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        `https://plex.tv/api/v2/pins/${specialCharPinId}`,
        {
          params: {
            code: specialCharPinCode,
            'X-Plex-Client-Identifier': 'test-app-id'
          }
        }
      );
    });

    it('should handle concurrent verification requests', async () => {
      // Arrange - Multiple simultaneous requests
      const requests = Array.from({ length: 5 }, () => 
        createMockRequestResponse({ method: 'POST' })
      );

      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      const mockPlexResponse = {
        authToken: 'test-auth-token'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockPlexResponse)
      );
      mockPlex.updateSettings.mockResolvedValue(undefined);

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
        expect(responseData).toEqual({ ok: true });
      });
      
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledTimes(5);
      expect(mockPlex.updateSettings).toHaveBeenCalledTimes(5);
    });

    it('should handle Plex TV API rate limiting', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('Too Many Requests', 429)
      );

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to verify authentication');
    });

    it('should preserve auth token format', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'POST' });
      
      const mockSettings = {
        pin_id: 'test-pin-id',
        pin_code: 'test-pin-code'
      };

      const complexToken = 'very-long-auth-token-with-special-chars-!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
      
      const mockPlexResponse = {
        authToken: complexToken
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);
      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockPlexResponse)
      );
      mockPlex.updateSettings.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).toHaveBeenCalledWith({ 
        token: complexToken 
      });
    });
  });
});