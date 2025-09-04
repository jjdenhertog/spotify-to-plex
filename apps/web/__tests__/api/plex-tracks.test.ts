/**
 * @file Plex Tracks API Route Tests
 * @description Tests for /api/plex/tracks endpoint - Plex library data fetching
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import handler from '../../pages/api/plex/tracks';
import {
  createMockRequestResponse,
  expectResponse,
  mockEnvVars,
  mockPlexResponses
} from './api-test-helpers';

// Mock plex library
const mockPlex = {
  getSettings: vi.fn(),
  getAllTracks: vi.fn(),
  searchTracks: vi.fn()
};

vi.mock('@/library/plex', () => ({
  plex: mockPlex
}));

// Mock error helper
vi.mock('@/helpers/errors/generateError', () => ({
  generateError: vi.fn()
}));

describe('/api/plex/tracks - Plex Library Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET requests - Fetch all tracks', () => {
    it('should return all tracks when authenticated', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockResolvedValue(mockPlexResponses.tracks);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual(mockPlexResponses.tracks);
      expect(mockPlex.getAllTracks).toHaveBeenCalledOnce();
    });

    it('should return 401 when not authenticated', async () => {
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
      expectResponse(res, 401, { error: 'Not authenticated with Plex' });
      expect(mockPlex.getAllTracks).not.toHaveBeenCalled();
    });

    it('should handle empty tracks response', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockResolvedValue([]);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, []);
    });

    it('should handle Plex library errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockRejectedValue(new Error('Plex library error'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Failed to fetch tracks');
    });
  });

  describe('GET requests - Search tracks', () => {
    it('should search tracks with query parameter', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { q: 'test song' }
      });
      
      const searchResults = [
        {
          id: 1,
          title: "Test Song Match",
          artist: "Test Artist",
          album: "Test Album",
          duration: 180000
        }
      ];

      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.searchTracks.mockResolvedValue(searchResults);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual(searchResults);
      expect(mockPlex.searchTracks).toHaveBeenCalledWith('test song');
      expect(mockPlex.getAllTracks).not.toHaveBeenCalled();
    });

    it('should handle empty search query', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { q: '' }
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockResolvedValue(mockPlexResponses.tracks);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(mockPlex.getAllTracks).toHaveBeenCalledOnce();
      expect(mockPlex.searchTracks).not.toHaveBeenCalled();
    });

    it('should handle search with no results', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { q: 'nonexistent song' }
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.searchTracks.mockResolvedValue([]);

      // Act
      await handler(req, res);

      // Assert
      expectResponse(res, 200, []);
    });
  });

  describe('POST requests - Create/Import tracks', () => {
    it('should handle track import requests', async () => {
      // Arrange
      const trackData = {
        title: "New Track",
        artist: "New Artist", 
        album: "New Album",
        spotifyId: "spotify-track-id"
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: trackData
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

      // Mock import functionality (assuming it exists)
      const mockImportTrack = vi.fn().mockResolvedValue({ 
        id: 999, 
        ...trackData,
        imported: true 
      });
      mockPlex.importTrack = mockImportTrack;

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(201);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.imported).toBe(true);
      expect(responseData.title).toBe(trackData.title);
    });

    it('should validate required fields in POST requests', async () => {
      // Arrange
      const incompleteData = {
        title: "New Track"
        // Missing artist, album
      };

      const { req, res } = createMockRequestResponse({ 
        method: 'POST',
        body: incompleteData
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('required');
    });
  });

  describe('Request validation', () => {
    it('should handle invalid HTTP methods', async () => {
      // Test PUT request
      const { req: putReq, res: putRes } = createMockRequestResponse({ method: 'PUT' });
      await handler(putReq, putRes);
      expect(putRes._getStatusCode()).toBe(405);

      // Test DELETE request
      const { req: delReq, res: delRes } = createMockRequestResponse({ method: 'DELETE' });
      await handler(delReq, delRes);
      expect(delRes._getStatusCode()).toBe(405);
    });

    it('should handle malformed query parameters', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { 
          q: ['array', 'of', 'values'], // Invalid array query
          limit: 'invalid-number'
        }
      });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockResolvedValue(mockPlexResponses.tracks);

      // Act
      await handler(req, res);

      // Assert - Should handle gracefully and return all tracks
      expect(res._getStatusCode()).toBe(200);
      expect(mockPlex.getAllTracks).toHaveBeenCalledOnce();
    });
  });

  describe('Performance and pagination', () => {
    it('should handle pagination parameters', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { 
          page: '2',
          limit: '10',
          offset: '10'
        }
      });
      
      const paginatedTracks = mockPlexResponses.tracks.slice(0, 10);
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockResolvedValue(paginatedTracks);

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.length).toBeLessThanOrEqual(10);
    });

    it('should handle large track libraries efficiently', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      // Create mock large dataset
      const largeTracks = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        title: `Track ${i}`,
        artist: `Artist ${i % 100}`,
        album: `Album ${i % 50}`,
        duration: 180000 + (i * 1000)
      }));

      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockResolvedValue(largeTracks);

      const startTime = Date.now();

      // Act
      await handler(req, res);

      // Assert
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(res._getStatusCode()).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.length).toBe(10000);
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle concurrent requests gracefully', async () => {
      // Arrange
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockPlexResponses.tracks), 100))
      );

      // Act - Make multiple concurrent requests
      const requests = Array.from({ length: 5 }, () => {
        const { req, res } = createMockRequestResponse({ method: 'GET' });
        return handler(req, res).then(() => res);
      });

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach(res => {
        expect(res._getStatusCode()).toBe(200);
      });
    });

    it('should handle Plex server downtime', async () => {
      // Arrange  
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      mockPlex.getSettings.mockResolvedValue(mockPlexResponses.settings);
      mockPlex.getAllTracks.mockRejectedValue(new Error('ECONNREFUSED'));

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(503);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Plex server unavailable');
    });
  });
});