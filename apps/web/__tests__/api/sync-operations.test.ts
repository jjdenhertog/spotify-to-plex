/**
 * @file Sync Operations API Route Tests
 * @description Tests for /api/sync/[type] endpoint - Sync operations (albums, playlists, users)
 * NOTE: Excludes sync-worker and MQTT functionality as specified
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import handler from '../../pages/api/sync/[type]';
import {
  createMockRequestResponse,
  expectResponse
} from './api-test-helpers';

// Mock cronjob functions
const mockSyncAlbums = vi.fn();
const mockSyncPlaylists = vi.fn(); 
const mockSyncUsers = vi.fn();

vi.mock('cronjob/albums', () => ({
  syncAlbums: mockSyncAlbums
}));

vi.mock('cronjob/playlists', () => ({
  syncPlaylists: mockSyncPlaylists
}));

vi.mock('cronjob/users', () => ({
  syncUsers: mockSyncUsers
}));

// Mock error helper
vi.mock('@/helpers/errors/generateError', () => ({
  generateError: vi.fn()
}));

describe('/api/sync/[type] - Sync Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Albums sync', () => {
    it('should successfully sync albums', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'albums' }
      });

      mockSyncAlbums.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, { ok: true });
      expect(mockSyncAlbums).toHaveBeenCalledOnce();
      expect(mockSyncPlaylists).not.toHaveBeenCalled();
      expect(mockSyncUsers).not.toHaveBeenCalled();
    });

    it('should handle albums sync errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'albums' }
      });

      const syncError = new Error('Failed to sync albums');
      mockSyncAlbums.mockRejectedValue(syncError);

      // Act & Assert - Should throw error and be handled by error boundary
      await expect(handler(req, res)).rejects.toThrow('Failed to sync albums');
      expect(mockSyncAlbums).toHaveBeenCalledOnce();
    });

    it('should handle long-running albums sync', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'albums' }
      });

      // Mock long-running sync (2 seconds)
      mockSyncAlbums.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );

      const startTime = Date.now();

      // Act
      await handler(req, res);

      // Assert
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeGreaterThanOrEqual(2000);
      expectResponse(res, 200, { ok: true });
      expect(mockSyncAlbums).toHaveBeenCalledOnce();
    });
  });

  describe('Playlists sync', () => {
    it('should successfully sync playlists', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'playlists' }
      });

      mockSyncPlaylists.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, { ok: true });
      expect(mockSyncPlaylists).toHaveBeenCalledOnce();
      expect(mockSyncAlbums).not.toHaveBeenCalled();
      expect(mockSyncUsers).not.toHaveBeenCalled();
    });

    it('should handle playlists sync errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'playlists' }
      });

      const syncError = new Error('Database connection failed');
      mockSyncPlaylists.mockRejectedValue(syncError);

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow('Database connection failed');
      expect(mockSyncPlaylists).toHaveBeenCalledOnce();
    });

    it('should handle empty playlists sync', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'playlists' }
      });

      // Mock sync that processes no playlists
      mockSyncPlaylists.mockImplementation(() => {
        // Simulate processing with no results
        return Promise.resolve();
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, { ok: true });
      expect(mockSyncPlaylists).toHaveBeenCalledOnce();
    });
  });

  describe('Users sync', () => {
    it('should successfully sync users', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'users' }
      });

      mockSyncUsers.mockResolvedValue(undefined);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, { ok: true });
      expect(mockSyncUsers).toHaveBeenCalledOnce();
      expect(mockSyncAlbums).not.toHaveBeenCalled();
      expect(mockSyncPlaylists).not.toHaveBeenCalled();
    });

    it('should handle users sync authentication errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'users' }
      });

      const authError = new Error('Authentication required');
      mockSyncUsers.mockRejectedValue(authError);

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow('Authentication required');
      expect(mockSyncUsers).toHaveBeenCalledOnce();
    });

    it('should handle concurrent users sync operations', async () => {
      // Arrange - Create multiple concurrent requests
      const requests = Array.from({ length: 3 }, () => 
        createMockRequestResponse({ 
          method: 'GET',
          query: { type: 'users' }
        })
      );

      mockSyncUsers.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // Act
      const responses = await Promise.all(
        requests.map(({ req, res }) => 
          handler(req, res).then(() => res).catch(() => res)
        )
      );

      // Assert
      responses.forEach(res => {
        expectResponse(res, 200, { ok: true });
      });
      
      expect(mockSyncUsers).toHaveBeenCalledTimes(3);
    });
  });

  describe('Request validation', () => {
    it('should reject invalid sync types', async () => {
      // Test invalid type
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'invalid-type' }
      });

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow(
        'Expecting type albums, playlists or users. Got invalid-type'
      );
    });

    it('should reject missing type parameter', async () => {
      // Arrange - No type query parameter
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: {}
      });

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow(
        'Expecting type albums, playlists or users. Got none'
      );
    });

    it('should handle array type parameter', async () => {
      // Arrange - Type as array (invalid)
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: ['albums', 'playlists'] }
      });

      // Act & Assert - Should handle array and take first value or error
      await expect(handler(req, res)).rejects.toThrow();
    });

    it('should only accept GET requests', async () => {
      // Test POST request
      const { req: postReq, res: postRes } = createMockRequestResponse({ 
        method: 'POST',
        query: { type: 'albums' }
      });
      
      await handler(postReq, postRes);
      expect(postRes._getStatusCode()).toBe(404);

      // Test PUT request
      const { req: putReq, res: putRes } = createMockRequestResponse({ 
        method: 'PUT',
        query: { type: 'albums' }
      });
      
      await handler(putReq, putRes);
      expect(putRes._getStatusCode()).toBe(404);
    });
  });

  describe('Performance and reliability', () => {
    it('should handle sync operations with proper timeout', async () => {
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'albums' }
      });

      // Mock very slow sync (should complete within reasonable time)
      mockSyncAlbums.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      );

      const startTime = Date.now();

      // Act
      await handler(req, res);

      // Assert
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 10 seconds (test timeout)
      expect(duration).toBeLessThan(10000);
      expectResponse(res, 200, { ok: true });
    });

    it('should handle memory-intensive sync operations', async () => {
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'playlists' }
      });

      // Mock sync that processes large amount of data
      mockSyncPlaylists.mockImplementation(async () => {
        // Simulate processing large dataset
        const largeArray = new Array(100000).fill(null).map((_, i) => ({
          id: i,
          name: `Playlist ${i}`,
          tracks: new Array(50).fill(null).map((_, j) => `Track ${j}`),
          processed: false
        }));

        // Process the data
        largeArray.forEach((playlist: { processed: boolean }) => {
          playlist.processed = true;
        });

        // Clean up
        largeArray.length = 0;
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, { ok: true });
      expect(mockSyncPlaylists).toHaveBeenCalledOnce();
    });

    it('should handle partial sync failures gracefully', async () => {
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'albums' }
      });

      // Mock sync that partially fails but doesn't throw
      mockSyncAlbums.mockImplementation(() => {
        // Simulate partial failure that gets handled internally
        console.warn('Some albums failed to sync, but operation continues');
        return Promise.resolve();
      });

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, { ok: true });
      expect(mockSyncAlbums).toHaveBeenCalledOnce();
    });
  });

  describe('Error boundary and logging', () => {
    it('should propagate sync errors to error handler', async () => {
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'users' }
      });

      const criticalError = new Error('Critical sync failure');
      criticalError.name = 'CriticalSyncError';
      mockSyncUsers.mockRejectedValue(criticalError);

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow('Critical sync failure');
      expect(mockSyncUsers).toHaveBeenCalledOnce();
    });

    it('should handle unexpected sync function behavior', async () => {
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { type: 'albums' }
      });

      // Mock sync function that returns unexpected value
      mockSyncAlbums.mockResolvedValue('unexpected-return-value');

      // Act
      await handler(req, res);

      // Assert - Should still work and return ok: true
      expectResponse(res, 200, { ok: true });
      expect(mockSyncAlbums).toHaveBeenCalledOnce();
    });
  });
});