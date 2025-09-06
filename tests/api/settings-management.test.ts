/**
 * @file Settings Management API Route Tests  
 * @description Tests for /api/settings endpoint - Advanced settings management with comprehensive validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import handler from '../../apps/web/pages/api/settings';
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

describe('/api/settings - Advanced Settings Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET requests - Retrieve settings', () => {
    it('should return current settings when user is authenticated', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const mockSettings = {
        token: 'test-plex-token',
        uri: 'http://192.168.1.100:32400',
        id: 'test-server-id'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        loggedin: true,
        uri: mockSettings.uri,
        id: mockSettings.id
      });
      
      expect(mockPlex.getSettings).toHaveBeenCalledOnce();
    });

    it('should return not logged in when no token exists', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const mockSettings = {
        token: null,
        uri: 'http://localhost:32400',
        id: 'local-server'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        loggedin: false,
        uri: mockSettings.uri,
        id: mockSettings.id
      });
    });

    it('should handle empty token (empty string)', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const mockSettings = {
        token: '',
        uri: 'http://localhost:32400',
        id: 'local-server'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.loggedin).toBe(false);
    });

    it('should handle undefined token', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const mockSettings = {
        token: undefined,
        uri: 'http://localhost:32400',
        id: 'local-server'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.loggedin).toBe(false);
    });

    it('should handle missing URI and ID gracefully', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const mockSettings = {
        token: 'valid-token',
        uri: null,
        id: null
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        loggedin: true,
        uri: null,
        id: null
      });
    });

    it('should handle settings read errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockRejectedValue(new Error('Settings file not found'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to get settings');
    });

    it('should handle file permission errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const permissionError = new Error('EACCES: permission denied') as any;
      permissionError.code = 'EACCES';
      mockPlex.getSettings.mockRejectedValue(permissionError);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to get settings');
    });

    it('should handle corrupted settings file', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockRejectedValue(new Error('Unexpected token in JSON'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to get settings');
    });
  });

  describe('POST requests - Update settings', () => {
    it('should update settings successfully with valid URI and ID', async () => {
      // Arrange
      const newSettings = {
        uri: 'http://192.168.1.200:32400',
        id: 'new-server-id'
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: newSettings
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'existing-token',
        ...newSettings
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        loggedin: true,
        uri: newSettings.uri,
        id: newSettings.id
      });
      
      expect(mockPlex.updateSettings).toHaveBeenCalledWith(newSettings);
      expect(mockPlex.getSettings).toHaveBeenCalledOnce();
    });

    it('should update only URI when ID is not provided', async () => {
      // Arrange
      const partialUpdate = {
        uri: 'http://new-server:32400'
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: partialUpdate
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'existing-token',
        uri: partialUpdate.uri,
        id: 'existing-id'
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.uri).toBe(partialUpdate.uri);
      expect(responseData.id).toBe('existing-id');
      
      expect(mockPlex.updateSettings).toHaveBeenCalledWith({
        uri: partialUpdate.uri,
        id: undefined
      });
    });

    it('should handle empty URI update request', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { uri: '' }
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'existing-token',
        uri: '',
        id: 'existing-id'
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      // The API does NOT call updateSettings with empty string because req.body.uri is falsy
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
    });

    it('should skip update when no URI is provided in body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { otherField: 'value' }
      });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'existing-token',
        uri: 'http://existing:32400',
        id: 'existing-id'
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
      expect(mockPlex.getSettings).toHaveBeenCalledOnce();
    });

    it('should handle null/undefined request body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: null
      });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'existing-token',
        uri: 'http://existing:32400',
        id: 'existing-id'
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
      expect(mockPlex.getSettings).toHaveBeenCalledOnce();
    });

    it('should handle empty object request body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: {}
      });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'existing-token',
        uri: 'http://existing:32400',
        id: 'existing-id'
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
    });

    it('should handle update settings errors', async () => {
      // Arrange
      const newSettings = {
        uri: 'http://failing-server:32400',
        id: 'failing-id'
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: newSettings
      });
      
      mockPlex.updateSettings.mockRejectedValue(new Error('Failed to write settings file'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to update settings');
    });

    it('should handle disk space errors during update', async () => {
      // Arrange
      const newSettings = {
        uri: 'http://server:32400',
        id: 'server-id'
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: newSettings
      });
      
      const diskFullError = new Error('ENOSPC: no space left on device') as any;
      diskFullError.code = 'ENOSPC';
      mockPlex.updateSettings.mockRejectedValue(diskFullError);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to update settings');
    });

    it('should handle settings read error after successful update', async () => {
      // Arrange
      const newSettings = {
        uri: 'http://server:32400',
        id: 'server-id'
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: newSettings
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockRejectedValue(new Error('Failed to read updated settings'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to update settings');
    });

    it('should handle complex URI formats', async () => {
      // Arrange
      const complexUris = [
        'https://plex.example.com:32400',
        'http://192.168.1.100:8080',
        'https://my-server.local:443',
        'http://[::1]:32400', // IPv6
        'https://user:pass@server.com:32400' // With credentials
      ];

      for (const uri of complexUris) {
        const { req, res } = createMockRequestResponse({ 
          method: 'POST',
          body: { uri, id: 'test-server' }
        });
        
        mockPlex.updateSettings.mockResolvedValue(undefined);
        mockPlex.getSettings.mockResolvedValue({
          token: 'token',
          uri,
          id: 'test-server'
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        
        const responseData = JSON.parse(res._getData());
        expect(responseData.uri).toBe(uri);
        
        vi.clearAllMocks();
      }
    });

    it('should handle very long URI and ID values', async () => {
      // Arrange
      const longUri = 'http://very-long-server-name-with-many-subdomains.example.company.com:32400/path/to/plex';
      const longId = 'a'.repeat(1000);

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { uri: longUri, id: longId }
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'token',
        uri: longUri,
        id: longId
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.uri).toBe(longUri);
      expect(responseData.id).toBe(longId);
    });

    it('should handle special characters in URI and ID', async () => {
      // Arrange
      const specialUri = 'http://server-with-special-chars!@#$%^&*():32400';
      const specialId = 'id-with-chars-+={}[]|\\:";\'<>?,./~`';

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { uri: specialUri, id: specialId }
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'token',
        uri: specialUri,
        id: specialId
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.uri).toBe(specialUri);
      expect(responseData.id).toBe(specialId);
    });
  });

  describe('Advanced edge cases and error handling', () => {
    it('should handle settings with all null values', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const nullSettings = {
        token: null,
        uri: null,
        id: null
      };

      mockPlex.getSettings.mockResolvedValue(nullSettings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        loggedin: false,
        uri: null,
        id: null
      });
    });

    it('should handle concurrent settings read requests', async () => {
      // Arrange - Multiple simultaneous GET requests
      const requests = Array.from({ length: 10 }, () => 
        createMockRequestResponse({ method: 'GET' })
      );

      const mockSettings = {
        token: 'concurrent-token',
        uri: 'http://concurrent-server:32400',
        id: 'concurrent-id'
      };

      mockPlex.getSettings.mockResolvedValue(mockSettings);

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
        expect(responseData.loggedin).toBe(true);
        expect(responseData.uri).toBe(mockSettings.uri);
      });
      
      expect(mockPlex.getSettings).toHaveBeenCalledTimes(10);
    });

    it('should handle concurrent settings update requests', async () => {
      // Arrange - Multiple simultaneous POST requests
      const updates = Array.from({ length: 5 }, (_, i) => ({
        uri: `http://server${i}:32400`,
        id: `server-id-${i}`
      }));

      const requests = updates.map(update => 
        createMockRequestResponse({ 
          method: 'POST',
          body: update
        })
      );

      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockImplementation(() => 
        Promise.resolve({
          token: 'token',
          uri: 'http://updated-server:32400',
          id: 'updated-id'
        })
      );

      // Act
      const responses = await Promise.all(
        requests.map(({ req, res }) => 
          handler(req, res).then(() => res).catch(() => res)
        )
      );

      // Assert
      responses.forEach(res => {
        expect(res._getStatusCode()).toBe(200);
      });
      
      expect(mockPlex.updateSettings).toHaveBeenCalledTimes(5);
      expect(mockPlex.getSettings).toHaveBeenCalledTimes(5);
    });

    it('should handle race condition between update and read', async () => {
      // Arrange - Simple concurrent operations without complex timing
      const updateRequest = createMockRequestResponse({ 
        method: 'POST',
        body: { uri: 'http://racing-server:32400', id: 'racing-id' }
      });

      const readRequest = createMockRequestResponse({ method: 'GET' });

      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'race-token',
        uri: 'http://race-server:32400',
        id: 'race-id'
      });

      // Act - Run both concurrently
      const [updateRes, readRes] = await Promise.all([
        handler(updateRequest.req, updateRequest.res).then(() => updateRequest.res),
        handler(readRequest.req, readRequest.res).then(() => readRequest.res)
      ]);

      // Assert
      expect(updateRes._getStatusCode()).toBe(200);
      expect(readRes._getStatusCode()).toBe(200);
    });

    it('should handle malformed JSON-like strings in settings', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { 
          uri: '{"malformed": json"}', // JSON-like but not proper JSON
          id: '[array, without, quotes]'
        }
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'token',
        uri: '{"malformed": json"}',
        id: '[array, without, quotes]'
      });

      // Act
      await handler(req, res);

      // Assert - Should handle as regular strings
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.uri).toBe('{"malformed": json"}');
      expect(responseData.id).toBe('[array, without, quotes]');
    });

    it('should handle mixed data types in request body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { 
          uri: 123, // Number instead of string
          id: true, // Boolean instead of string
          extra: { nested: 'object' }
        }
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'token',
        uri: 123,
        id: true
      });

      // Act
      await handler(req, res);

      // Assert - Should handle mixed types and pass through both uri and id
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).toHaveBeenCalledWith({
        uri: 123,
        id: true // id is passed through as well
      });
    });

    it('should maintain settings persistence across errors', async () => {
      // Arrange - First call fails, second succeeds
      const failingSettings = {
        uri: 'http://failing-server:32400',
        id: 'failing-id'
      };

      const workingSettings = {
        uri: 'http://working-server:32400',
        id: 'working-id'
      };

      const failingRequest = createMockRequestResponse({ 
        method: 'POST',
        body: failingSettings
      });

      const workingRequest = createMockRequestResponse({ 
        method: 'POST',
        body: workingSettings
      });
      
      // First update fails
      mockPlex.updateSettings
        .mockRejectedValueOnce(new Error('First update failed'))
        .mockResolvedValueOnce(undefined);

      mockPlex.getSettings.mockResolvedValue({
        token: 'persistent-token',
        ...workingSettings
      });

      // Act
      await handler(failingRequest.req, failingRequest.res);
      await handler(workingRequest.req, workingRequest.res);

      // Assert
      expect(failingRequest.res._getStatusCode()).toBe(500);
      expect(workingRequest.res._getStatusCode()).toBe(200);
      
      const workingResponseData = JSON.parse(workingRequest.res._getData());
      expect(workingResponseData.uri).toBe(workingSettings.uri);
    });
  });

  describe('Request validation', () => {
    it('should handle unsupported HTTP methods', async () => {
      // The router may handle errors differently, so let's test one method and expect the error handler
      const { req: putReq, res: putRes } = createMockRequestResponse({ method: 'PUT' });
      await handler(putReq, putRes);
      
      // The next-connect router might return different status codes or trigger the error handler
      expect([404, 500]).toContain(putRes._getStatusCode());
    });

    it('should handle requests with custom headers', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
          'X-Custom-Header': 'custom-value'
        }
      });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'test-token',
        uri: 'http://server:32400',
        id: 'server-id'
      });

      // Act
      await handler(req, res);

      // Assert - Headers should not affect functionality
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.loggedin).toBe(true);
    });

    it('should handle very large request payloads', async () => {
      // Arrange
      const largePayload = {
        uri: 'http://server:32400',
        id: 'server-id',
        largeField: 'x'.repeat(100000) // 100KB string
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: largePayload
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'token',
        uri: largePayload.uri,
        id: largePayload.id
      });

      // Act
      await handler(req, res);

      // Assert - Should handle large payloads gracefully
      expect(res._getStatusCode()).toBe(200);
    });
  });
});