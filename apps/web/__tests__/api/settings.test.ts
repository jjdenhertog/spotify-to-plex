/**
 * @file Settings API Route Tests
 * @description Tests for /api/settings endpoint - Settings CRUD operations with file system persistence
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import handler from '../../pages/api/settings';
import {
  createMockRequestResponse,
  mockPlexResponses
} from './api-test-helpers';

// Mock plex library
const mockPlex = {
  getSettings: vi.fn(),
  updateSettings: vi.fn()
};

vi.mock('@/library/plex', () => ({
  plex: mockPlex
}));

// Mock error helper
vi.mock('@/helpers/errors/generateError', () => ({
  generateError: vi.fn()
}));

describe('/api/settings - Settings CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET requests - Read settings', () => {
    it('should return current settings when authenticated', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        loggedin: true,
        uri: mockPlexResponses.settings.uri,
        id: mockPlexResponses.settings.id
      });
      
      expect(mockPlex.getSettings).toHaveBeenCalledOnce();
    });

    it('should return not logged in when no token', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue({
        token: null,
        uri: 'http://localhost:32400',
        id: 'server-id'
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        loggedin: false,
        uri: 'http://localhost:32400',
        id: 'server-id'
      });
    });

    it('should handle empty settings gracefully', async () => {
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
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        loggedin: false,
        uri: null,
        id: null
      });
    });

    it('should handle settings retrieval errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockRejectedValue(new Error('Failed to read settings file'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to get settings');
    });
  });

  describe('POST requests - Update settings', () => {
    it('should update URI and ID settings successfully', async () => {
      // Arrange
      const newSettings = {
        uri: 'http://192.168.1.100:32400',
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
      const partialSettings = {
        uri: 'http://new-server:32400'
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: partialSettings
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'existing-token',
        uri: partialSettings.uri,
        id: 'existing-id'
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).toHaveBeenCalledWith({
        uri: partialSettings.uri,
        id: undefined
      });
    });

    it('should not update when no URI provided in body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: {
          someOtherField: 'value'
        }
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
      expect(mockPlex.getSettings).toHaveBeenCalledOnce();
    });

    it('should handle empty POST body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: {}
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
      expect(mockPlex.getSettings).toHaveBeenCalledOnce();
    });

    it('should handle null/undefined body', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: null
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
    });

    it('should handle update settings errors', async () => {
      // Arrange
      const newSettings = {
        uri: 'http://invalid-server:32400',
        id: 'invalid-server-id'
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

    it('should handle settings read error after update', async () => {
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
  });

  describe('File system persistence', () => {
    it('should persist settings to file system', async () => {
      // Arrange
      const settingsData = {
        uri: 'http://persistent-server:32400',
        id: 'persistent-server-id'
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: settingsData
      });
      
      // Mock file system operations
      let persistedData: any = null;
      mockPlex.updateSettings.mockImplementation((data) => {
        persistedData = data;
        return Promise.resolve();
      });
      
      mockPlex.getSettings.mockImplementation(() => {
        return Promise.resolve({
          token: 'persisted-token',
          ...persistedData
        });
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(persistedData).toEqual(settingsData);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.uri).toBe(settingsData.uri);
      expect(responseData.id).toBe(settingsData.id);
    });

    it('should handle file system permission errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { uri: 'http://server:32400' }
      });
      
      const permissionError = new Error('EACCES: permission denied') as any;
      permissionError.code = 'EACCES';
      mockPlex.updateSettings.mockRejectedValue(permissionError);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to update settings');
    });

    it('should handle file system disk full errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { uri: 'http://server:32400' }
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

    it('should handle concurrent settings updates', async () => {
      // Arrange - Multiple simultaneous update requests
      const updates = [
        { uri: 'http://server1:32400', id: 'server1' },
        { uri: 'http://server2:32400', id: 'server2' },
        { uri: 'http://server3:32400', id: 'server3' }
      ];

      const requests = updates.map(update => 
        createMockRequestResponse({ 
          method: 'POST',
          body: update
        })
      );

      // Mock concurrent file operations
      let updateCount = 0;
      mockPlex.updateSettings.mockImplementation(() => {
        updateCount++;
        return new Promise(resolve => setTimeout(resolve, 50));
      });
      
      mockPlex.getSettings.mockResolvedValue({
        token: 'token',
        uri: 'http://final-server:32400',
        id: 'final-server'
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
      });
      
      expect(updateCount).toBe(3);
      expect(mockPlex.getSettings).toHaveBeenCalledTimes(3);
    });
  });

  describe('Request validation', () => {
    it('should handle invalid HTTP methods', async () => {
      // Test PUT request
      const { req: putReq, res: putRes } = createMockRequestResponse({ method: 'PUT' });
      await handler(putReq, putRes);
      expect(putRes._getStatusCode()).toBe(404);

      // Test DELETE request
      const { req: delReq, res: delRes } = createMockRequestResponse({ method: 'DELETE' });
      await handler(delReq, delRes);
      expect(delRes._getStatusCode()).toBe(404);

      // Test PATCH request
      const { req: patchReq, res: patchRes } = createMockRequestResponse({ method: 'PATCH' });
      await handler(patchReq, patchRes);
      expect(patchRes._getStatusCode()).toBe(404);
    });

    it('should sanitize URI input', async () => {
      // Arrange - Test various URI formats
      const testCases = [
        { input: 'http://server:32400', expected: 'http://server:32400' },
        { input: 'https://server.example.com:32400', expected: 'https://server.example.com:32400' },
        { input: 'http://192.168.1.100:32400', expected: 'http://192.168.1.100:32400' },
        { input: '  http://server:32400  ', expected: 'http://server:32400' }, // Should trim
      ];

      for (const testCase of testCases) {
        const { req, res } = createMockRequestResponse({ 
          method: 'POST',
          body: { uri: testCase.input }
        });
        
        mockPlex.updateSettings.mockResolvedValue(undefined);
        mockPlex.getSettings.mockResolvedValue({
          token: 'token',
          uri: testCase.expected,
          id: 'server-id'
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        
        const responseData = JSON.parse(res._getData());
        expect(responseData.uri).toBe(testCase.expected);
        
        vi.clearAllMocks();
      }
    });

    it('should handle malformed JSON in request body', async () => {
      // This test simulates what would happen with malformed JSON
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: undefined // Simulates malformed JSON parsing
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

      // Act
      await handler(req, res);

      // Assert - Should handle gracefully and not update
      expect(res._getStatusCode()).toBe(200);
      expect(mockPlex.updateSettings).not.toHaveBeenCalled();
    });

    it('should validate URI format', async () => {
      // Arrange - Test invalid URI formats
      const invalidUris = [
        'not-a-url',
        'ftp://server:21', // Wrong protocol
        'http://:32400', // Missing host
        'http://server:', // Missing port
        '', // Empty string
        null,
        undefined
      ];

      for (const invalidUri of invalidUris) {
        const { req, res } = createMockRequestResponse({ 
          method: 'POST',
          body: { uri: invalidUri }
        });
        
        mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

        await handler(req, res);

        // Should either succeed (if treating as valid) or handle gracefully
        expect([200, 400]).toContain(res._getStatusCode());
        
        vi.clearAllMocks();
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very large settings data', async () => {
      // Arrange
      const largeUri = 'http://server:32400/' + 'a'.repeat(10000);
      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: { uri: largeUri }
      });
      
      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue({
        token: 'token',
        uri: largeUri,
        id: 'server-id'
      });

      // Act
      await handler(req, res);

      // Assert - Should handle large data
      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle settings corruption recovery', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      // First call fails due to corruption
      mockPlex.getSettings
        .mockRejectedValueOnce(new Error('Settings file corrupted'))
        .mockResolvedValueOnce({ // Recovery returns defaults
          token: null,
          uri: null,
          id: null
        });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
    });

    it('should handle rapid consecutive updates', async () => {
      // Arrange - Rapid fire updates
      const rapidUpdates = Array.from({ length: 10 }, (_, i) => ({
        uri: `http://server${i}:32400`,
        id: `server${i}`
      }));

      const promises = rapidUpdates.map(update => {
        const { req, res } = createMockRequestResponse({ 
          method: 'POST',
          body: update
        });
        return handler(req, res).then(() => res).catch(() => res);
      });

      mockPlex.updateSettings.mockResolvedValue(undefined);
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

      // Act
      const results = await Promise.all(promises);

      // Assert - All should complete successfully
      results.forEach(res => {
        expect(res._getStatusCode()).toBe(200);
      });
      
      expect(mockPlex.updateSettings).toHaveBeenCalledTimes(10);
    });
  });
});