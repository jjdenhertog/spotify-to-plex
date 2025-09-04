/**
 * @file Plex Connection API Route Tests
 * @description Tests for /api/plex/resources endpoint - Plex server connection validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import handler from '../../pages/api/plex/resources';
import { 
  createMockRequestResponse, 
  expectResponse, 
  mockEnvVars,
  createMockAxiosResponse,
  createMockAxiosError,
  mockPlexResponses 
} from './api-test-helpers';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock plex library
const mockPlex = {
  getSettings: vi.fn()
};

vi.mock('@/library/plex', () => ({
  plex: mockPlex
}));

// Mock error helper
vi.mock('@/helpers/errors/generateError', () => ({
  generateError: vi.fn()
}));

describe('/api/plex/resources - Plex Connection Validation', () => {
  mockEnvVars({
    PLEX_APP_ID: 'test-app-id'
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET requests', () => {
    it('should return Plex servers when authenticated', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-plex-token',
        uri: 'http://localhost:32400',
        id: 'test-server-id'
      });

      mockedAxios.get.mockResolvedValue(
        createMockAxiosResponse(mockPlexResponses.resources)
      );

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveLength(1);
      expect(responseData[0]).toEqual({
        name: "Test Server",
        id: "test-server-id", 
        connections: [
          { uri: "http://192.168.1.100:32400", local: true },
          { uri: "https://test.plex.direct:443", local: false }
        ]
      });

      // Verify Plex API was called with correct parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://plex.tv/api/v2/resources',
        {
          params: {
            "X-Plex-Product": "Spotify to Plex",
            "X-Plex-Client-Identifier": "test-app-id",
            "X-Plex-Token": "test-plex-token",
          }
        }
      );
    });

    it('should return 400 when no Plex connection found', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: null,
        uri: null,
        id: null
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, { message: "No Plex connection found" });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return 400 when Plex API fails', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-plex-token',
        uri: 'http://localhost:32400',
        id: 'test-server-id'
      });

      mockedAxios.get.mockRejectedValue(
        createMockAxiosError('Plex API Error', 401)
      );

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 400, { message: "No resources found" });
    });

    it('should handle HTTPS required servers correctly', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-plex-token',
        uri: 'http://localhost:32400',
        id: 'test-server-id'
      });

      const httpsRequiredResponse = [{
        product: "Plex Media Server",
        name: "HTTPS Server",
        clientIdentifier: "https-server-id",
        httpsRequired: true,
        connections: [
          { uri: "http://192.168.1.100:32400", local: true }
        ]
      }];

      mockedAxios.get.mockResolvedValue(
        createMockAxiosResponse(httpsRequiredResponse)
      );

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData[0].connections[0].uri).toBe("https://192.168.1.100:32400");
    });

    it('should filter out non-Plex Media Server products', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-plex-token',
        uri: 'http://localhost:32400',
        id: 'test-server-id'
      });

      const mixedProductsResponse = [
        {
          product: "Plex Media Server",
          name: "Media Server",
          clientIdentifier: "server-1",
          connections: [{ uri: "http://192.168.1.100:32400", local: true }]
        },
        {
          product: "Plex Web",
          name: "Web Client", 
          clientIdentifier: "client-1",
          connections: [{ uri: "http://app.plex.tv", local: false }]
        }
      ];

      mockedAxios.get.mockResolvedValue(
        createMockAxiosResponse(mixedProductsResponse)
      );

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveLength(1);
      expect(responseData[0].name).toBe("Media Server");
    });

    it('should handle empty Plex resources response', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-plex-token',
        uri: 'http://localhost:32400',
        id: 'test-server-id'
      });

      mockedAxios.get.mockResolvedValue(
        createMockAxiosResponse([])
      );

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, []);
    });
  });

  describe('Request validation', () => {
    it('should handle missing environment variables', async () => {
      // Override environment temporarily
      const originalAppId = process.env.PLEX_APP_ID;
      delete process.env.PLEX_APP_ID;

      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-plex-token',
        uri: 'http://localhost:32400',
        id: 'test-server-id'
      });

      mockedAxios.get.mockResolvedValue(
        createMockAxiosResponse(mockPlexResponses.resources)
      );

      // Act
      await handler(req, res);

      // Assert - Should still work with undefined PLEX_APP_ID
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://plex.tv/api/v2/resources',
        {
          params: {
            "X-Plex-Product": "Spotify to Plex",
            "X-Plex-Client-Identifier": undefined,
            "X-Plex-Token": "test-plex-token",
          }
        }
      );

      // Restore environment
      if (originalAppId) {
        process.env.PLEX_APP_ID = originalAppId;
      }
    });

    it('should only accept GET requests', async () => {
      // Test POST request
      const { req: postReq, res: postRes } = createMockRequestResponse({ method: 'POST' });
      await handler(postReq, postRes);
      expect(postRes._getStatusCode()).toBe(404);

      // Test PUT request  
      const { req: putReq, res: putRes } = createMockRequestResponse({ method: 'PUT' });
      await handler(putReq, putRes);
      expect(putRes._getStatusCode()).toBe(404);

      // Test DELETE request
      const { req: delReq, res: delRes } = createMockRequestResponse({ method: 'DELETE' });
      await handler(delReq, delRes);
      expect(delRes._getStatusCode()).toBe(404);
    });
  });

  describe('Error handling', () => {
    it('should handle network timeouts', async () => {
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-plex-token',
        uri: 'http://localhost:32400',
        id: 'test-server-id'
      });

      const timeoutError = new Error('timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockedAxios.get.mockRejectedValue(timeoutError);

      await handler(req, res);

      expectResponse(res, 400, { message: "No resources found" });
    });

    it('should handle malformed Plex API responses', async () => {
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-plex-token',
        uri: 'http://localhost:32400',
        id: 'test-server-id'
      });

      // Mock response with missing required fields
      const malformedResponse = [{
        product: "Plex Media Server",
        // missing name, clientIdentifier, connections
      }];

      mockedAxios.get.mockResolvedValue(
        createMockAxiosResponse(malformedResponse)
      );

      await handler(req, res);

      expectResponse(res, 200, []);
    });
  });
});