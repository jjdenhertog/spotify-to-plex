/**
 * @file Spotify Authentication API Route Tests
 * @description Tests for /api/spotify/login endpoint - OAuth flow testing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import handler from '../../pages/api/spotify/login';
import {
  createMockRequestResponse,
  expectResponse,
  mockEnvVars
} from './api-test-helpers';

// Mock error helper
vi.mock('@/helpers/errors/generateError', () => ({
  generateError: vi.fn()
}));

describe('/api/spotify/login - Spotify OAuth Flow', () => {
  const mockEnvVariables = {
    SPOTIFY_API_REDIRECT_URI: 'http://localhost:3000/api/auth/callback',
    SPOTIFY_API_CLIENT_ID: 'test-client-id'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variables
    Object.entries(mockEnvVariables).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Clean up environment variables
    Object.keys(mockEnvVariables).forEach(key => {
      delete process.env[key];
    });
  });

  describe('GET requests - OAuth initiation', () => {
    it('should redirect to Spotify authorization URL', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(302);
      
      const location = res._getRedirectUrl();
      expect(location).toContain('https://accounts.spotify.com/authorize');
      expect(location).toContain('response_type=code');
      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain(encodeURIComponent('http://localhost:3000/api/auth/callback'));
    });

    it('should include required OAuth scopes', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });
      
      const expectedScopes = [
        'user-read-recently-played',
        'user-library-read',
        'playlist-read-private',
        'playlist-read-collaborative',
        'user-read-playback-state'
      ];

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      const scopeParam = expectedScopes.join(' ');
      expect(location).toContain(encodeURIComponent(scopeParam));
    });

    it('should handle missing SPOTIFY_API_REDIRECT_URI', async () => {
      // Arrange
      delete process.env.SPOTIFY_API_REDIRECT_URI;
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow(
        'Missing environment variables: SPOTIFY_API_REDIRECT_URI'
      );
    });

    it('should handle missing SPOTIFY_API_CLIENT_ID', async () => {
      // Arrange
      delete process.env.SPOTIFY_API_CLIENT_ID;
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow(
        'Missing environment variables: SPOTIFY_API_CLIENT_ID'
      );
    });

    it('should handle both missing environment variables', async () => {
      // Arrange
      delete process.env.SPOTIFY_API_REDIRECT_URI;
      delete process.env.SPOTIFY_API_CLIENT_ID;
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act & Assert
      // Should throw for the first missing variable encountered
      await expect(handler(req, res)).rejects.toThrow('Missing environment variables:');
    });
  });

  describe('OAuth URL construction', () => {
    it('should properly encode redirect URI with special characters', async () => {
      // Arrange
      process.env.SPOTIFY_API_REDIRECT_URI = 'https://example.com/callback?param=value&other=test';
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      expect(location).toContain(encodeURIComponent('https://example.com/callback?param=value&other=test'));
    });

    it('should properly encode client ID with special characters', async () => {
      // Arrange
      process.env.SPOTIFY_API_CLIENT_ID = 'client-id-with-special_chars+and=symbols';
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      expect(location).toContain('client_id=client-id-with-special_chars%2Band%3Dsymbols');
    });

    it('should construct valid authorization URL structure', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      
      // Parse URL to verify structure
      const url = new URL(location);
      expect(url.hostname).toBe('accounts.spotify.com');
      expect(url.pathname).toBe('/authorize');
      
      const params = url.searchParams;
      expect(params.get('response_type')).toBe('code');
      expect(params.get('client_id')).toBe('test-client-id');
      expect(params.get('redirect_uri')).toBe('http://localhost:3000/api/auth/callback');
      expect(params.get('scope')).toBeTruthy();
    });

    it('should handle localhost redirect URIs correctly', async () => {
      // Arrange
      process.env.SPOTIFY_API_REDIRECT_URI = 'http://localhost:3000/auth/callback';
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      expect(location).toContain(encodeURIComponent('http://localhost:3000/auth/callback'));
    });

    it('should handle HTTPS redirect URIs correctly', async () => {
      // Arrange
      process.env.SPOTIFY_API_REDIRECT_URI = 'https://myapp.com/auth/spotify/callback';
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      expect(location).toContain(encodeURIComponent('https://myapp.com/auth/spotify/callback'));
    });
  });

  describe('Request validation', () => {
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

      // Test PATCH request
      const { req: patchReq, res: patchRes } = createMockRequestResponse({ method: 'PATCH' });
      await handler(patchReq, patchRes);
      expect(patchRes._getStatusCode()).toBe(404);
    });

    it('should ignore query parameters in GET request', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        query: {
          'unexpected': 'parameter',
          'state': 'user-provided-state'
        }
      });

      // Act
      await handler(req, res);

      // Assert - Should still redirect successfully, ignoring query params
      expect(res._getStatusCode()).toBe(302);
      const location = res._getRedirectUrl();
      expect(location).toContain('https://accounts.spotify.com/authorize');
    });

    it('should ignore request body in GET request', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ 
        method: 'GET',
        body: {
          'malicious': 'data',
          'should': 'be-ignored'
        }
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(302);
      const location = res._getRedirectUrl();
      expect(location).not.toContain('malicious');
      expect(location).not.toContain('should');
    });
  });

  describe('Security considerations', () => {
    it('should not leak environment variables in error messages', async () => {
      // Arrange
      process.env.SPOTIFY_API_CLIENT_ID = 'secret-client-id';
      delete process.env.SPOTIFY_API_REDIRECT_URI;
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act & Assert
      try {
        await handler(req, res);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).not.toContain('secret-client-id');
        expect(error.message).toContain('SPOTIFY_API_REDIRECT_URI');
      }
    });

    it('should use HTTPS for authorization URL', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      expect(location).toMatch(/^https:\/\//);
    });

    it('should not include sensitive data in redirect URL', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      
      // Should not contain any potential secrets
      expect(location).not.toContain('password');
      expect(location).not.toContain('secret');
      expect(location).not.toContain('token');
      expect(location).not.toContain('key');
    });
  });

  describe('OAuth scope validation', () => {
    it('should include minimum required scopes', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      const url = new URL(location);
      const scopeParam = url.searchParams.get('scope');
      
      expect(scopeParam).toContain('user-read-recently-played');
      expect(scopeParam).toContain('user-library-read');
      expect(scopeParam).toContain('playlist-read-private');
      expect(scopeParam).toContain('playlist-read-collaborative');
      expect(scopeParam).toContain('user-read-playback-state');
    });

    it('should not include unnecessary scopes', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      const url = new URL(location);
      const scopeParam = url.searchParams.get('scope');
      
      // Should not include write scopes that aren't needed
      expect(scopeParam).not.toContain('playlist-modify-public');
      expect(scopeParam).not.toContain('playlist-modify-private');
      expect(scopeParam).not.toContain('user-modify-playback-state');
      expect(scopeParam).not.toContain('user-follow-modify');
    });

    it('should properly space-separate multiple scopes', async () => {
      // Arrange
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert
      const location = res._getRedirectUrl();
      const url = new URL(location);
      const scopeParam = url.searchParams.get('scope');
      
      // Should be space-separated, not comma-separated
      expect(scopeParam).toContain(' ');
      expect(scopeParam).not.toContain(',');
      
      const scopes = scopeParam.split(' ');
      expect(scopes.length).toBeGreaterThan(1);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty environment variables', async () => {
      // Arrange
      process.env.SPOTIFY_API_REDIRECT_URI = '';
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow();
    });

    it('should handle whitespace-only environment variables', async () => {
      // Arrange
      process.env.SPOTIFY_API_CLIENT_ID = '   ';
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act & Assert
      await expect(handler(req, res)).rejects.toThrow();
    });

    it('should handle very long environment variables', async () => {
      // Arrange - Very long client ID and redirect URI
      process.env.SPOTIFY_API_CLIENT_ID = 'a'.repeat(1000);
      process.env.SPOTIFY_API_REDIRECT_URI = 'https://example.com/' + 'b'.repeat(1000);
      
      const { req, res } = createMockRequestResponse({ method: 'GET' });

      // Act
      await handler(req, res);

      // Assert - Should handle long values gracefully
      expect(res._getStatusCode()).toBe(302);
      const location = res._getRedirectUrl();
      expect(location.length).toBeGreaterThan(1000); // Should be very long URL
    });
  });
});