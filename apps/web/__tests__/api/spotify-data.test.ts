/**
 * @file Spotify Data API Route Tests
 * @description Tests for Spotify playlist and track data endpoints
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import handlerUsers from '../../pages/api/spotify/users';
import handlerTrack from '../../pages/api/spotify/track';
import handlerUsersItems from '../../pages/api/spotify/users/[id]/items';
import {
  createMockRequestResponse,
  expectResponse,
  createMockAxiosResponse,
  createMockAxiosError,
  mockSpotifyResponses
} from './api-test-helpers';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock error helper
vi.mock('@/helpers/errors/generateError', () => ({
  generateError: vi.fn()
}));

describe('Spotify Data API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('/api/spotify/users - User Data', () => {
    it('should fetch user profile data', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockSpotifyResponses.user)
      );

      // Act
      await handlerUsers(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual(mockSpotifyResponses.user);
      
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );
    });

    it('should handle missing authorization header', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handlerUsers(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(401);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Authorization required');
      expect(vi.mocked(mockedAxios.get)).not.toHaveBeenCalled();
    });

    it('should handle invalid authorization token', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer invalid-token'
        }
      });

      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('Invalid access token', 401)
      );

      // Act
      await handlerUsers(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(401);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Invalid access token');
    });

    it('should handle Spotify API errors', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('Spotify API unavailable', 503)
      );

      // Act
      await handlerUsers(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(503);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Spotify API unavailable');
    });
  });

  describe('/api/spotify/track - Individual Track Data', () => {
    it('should fetch track data by ID', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'track-123' },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      const trackData = {
        id: 'track-123',
        name: 'Test Track',
        artists: [{ name: 'Test Artist', id: 'artist-123' }],
        album: { 
          name: 'Test Album', 
          id: 'album-123',
          images: [{ url: 'http://example.com/image.jpg' }]
        },
        duration_ms: 180000,
        explicit: false,
        external_urls: {
          spotify: 'https://open.spotify.com/track/track-123'
        }
      };

      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(trackData)
      );

      // Act
      await handlerTrack(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual(trackData);
      
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/tracks/track-123',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );
    });

    it('should handle missing track ID parameter', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      // Act
      await handlerTrack(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Track ID required');
      expect(vi.mocked(mockedAxios.get)).not.toHaveBeenCalled();
    });

    it('should handle track not found', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'nonexistent-track' },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('Track not found', 404)
      );

      // Act
      await handlerTrack(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(404);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Track not found');
    });

    it('should handle malformed track ID', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'invalid-track-id-format!' },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('Invalid track ID format', 400)
      );

      // Act
      await handlerTrack(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Invalid track ID format');
    });
  });

  describe('/api/spotify/users/[id]/items - User Playlist/Track Items', () => {
    it('should fetch user playlists', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'user-123' },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockSpotifyResponses.playlists)
      );

      // Act
      await handlerUsersItems(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual(mockSpotifyResponses.playlists);
      
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/users/user-123/playlists',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );
    });

    it('should fetch user saved tracks', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { 
          id: 'user-123',
          type: 'tracks' 
        },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      const savedTracks = {
        items: mockSpotifyResponses.tracks.map(track => ({
          added_at: '2023-01-01T00:00:00Z',
          track
        })),
        total: mockSpotifyResponses.tracks.length
      };

      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(savedTracks)
      );

      // Act
      await handlerUsersItems(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual(savedTracks);
      
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/tracks',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { 
          id: 'user-123',
          limit: '50',
          offset: '100'
        },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(mockSpotifyResponses.playlists)
      );

      // Act
      await handlerUsersItems(req, res);

      // Assert
      expect(vi.mocked(mockedAxios.get)).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/users/user-123/playlists',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          },
          params: {
            limit: 50,
            offset: 100
          }
        }
      );
    });

    it('should handle missing user ID', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      // Act
      await handlerUsersItems(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('User ID required');
      expect(vi.mocked(mockedAxios.get)).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'nonexistent-user' },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('User not found', 404)
      );

      // Act
      await handlerUsersItems(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(404);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('User not found');
    });

    it('should handle private playlists access denied', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'private-user' },
        headers: {
          'authorization': 'Bearer limited-scope-token'
        }
      });

      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('Insufficient scope', 403)
      );

      // Act
      await handlerUsersItems(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(403);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Insufficient scope');
    });
  });

  describe('Common functionality across endpoints', () => {
    it('should handle rate limiting from Spotify API', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      const rateLimitError = createMockAxiosError('Rate limit exceeded', 429);
      rateLimitError.response.headers = {
        'retry-after': '60'
      };

      vi.mocked(mockedAxios.get).mockRejectedValue(rateLimitError);

      // Act
      await handlerUsers(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(429);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Rate limit exceeded');
      expect(responseData.retryAfter).toBe(60);
    });

    it('should handle expired access tokens', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer expired-token'
        }
      });

      vi.mocked(mockedAxios.get).mockRejectedValue(
        createMockAxiosError('The access token expired', 401)
      );

      // Act
      await handlerUsers(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(401);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('The access token expired');
    });

    it('should handle malformed authorization headers', async () => {
      // Test cases for different malformed auth headers
      const malformedHeaders = [
        'invalid-format',
        'Bearer', // Missing token
        'Basic dGVzdA==', // Wrong auth type
        'Bearer   ', // Empty token with spaces
        'bearer test-token' // Wrong case
      ];

      for (const authHeader of malformedHeaders) {
        const { req, res } = createMockRequestResponse({ 
          method: 'GET',
          headers: {
            'authorization': authHeader
          }
        });

        await handlerUsers(req, res);

        expect([400, 401]).toContain(res._getStatusCode());
        expect(vi.mocked(mockedAxios.get)).not.toHaveBeenCalled();
        
        vi.clearAllMocks();
      }
    });

    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      const timeoutError = new Error('timeout') as any;
      timeoutError.code = 'ETIMEDOUT';
      vi.mocked(mockedAxios.get).mockRejectedValue(timeoutError);

      // Act
      await handlerUsers(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(408);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Request timeout');
    });

    it('should sanitize sensitive data from error responses', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      const errorWithSensitiveData = createMockAxiosError('Error with token: secret-data', 500);
      vi.mocked(mockedAxios.get).mockRejectedValue(errorWithSensitiveData);

      // Act
      await handlerUsers(req, res);

      // Assert
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).not.toContain('secret-data');
      expect(responseData.error).not.toContain('token:');
    });
  });

  describe('Data validation and transformation', () => {
    it('should validate playlist data structure', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'user-123' },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      const malformedPlaylistData = {
        items: [
          { // Missing required fields
            name: 'Test Playlist'
            // Missing id, tracks, etc.
          }
        ]
      };

      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(malformedPlaylistData)
      );

      // Act
      await handlerUsersItems(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      
      // Should still return data but potentially with validation warnings
      const responseData = JSON.parse(res._getData());
      expect(responseData.items).toHaveLength(1);
    });

    it('should handle empty API responses', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'user-with-no-playlists' },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse({ items: [], total: 0 })
      );

      // Act
      await handlerUsersItems(req, res);

      // Assert
      expectResponse(res, 200, { items: [], total: 0 });
    });

    it('should handle large dataset responses efficiently', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: { id: 'user-with-many-playlists' },
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      // Create large mock dataset
      const largePlaylists = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: `playlist-${i}`,
          name: `Playlist ${i}`,
          tracks: { total: 100 + i }
        })),
        total: 1000
      };

      vi.mocked(mockedAxios.get).mockResolvedValue(
        createMockAxiosResponse(largePlaylists)
      );

      const startTime = Date.now();

      // Act
      await handlerUsersItems(req, res);

      // Assert
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000); // Should handle large data quickly
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.items).toHaveLength(1000);
    });
  });
});