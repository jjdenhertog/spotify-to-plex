import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { Agent } from 'node:https';
import { axiosDelete } from '../../methods/axiosDelete';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock https Agent
vi.mock('node:https', () => ({
  Agent: vi.fn()
}));
const MockedAgent = vi.mocked(Agent);

describe('axiosDelete', () => {
  const testUrl = 'https://api.plex.com/playlists/123';
  const testToken = 'test-plex-token';
  const mockAgent = { rejectUnauthorized: false };

  beforeEach(() => {
    vi.clearAllMocks();
    MockedAgent.mockImplementation(() => mockAgent as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should make DELETE request with correct parameters', async () => {
      const mockResponse = { data: { success: true, deleted: true } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete(testUrl, testToken);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        testUrl,
        {
          httpsAgent: mockAgent,
          headers: {
            'Accept': 'application/json',
            'X-Plex-Token': testToken
          }
        }
      );
      expect(result).toBe(mockResponse);
    });

    it('should not include request body (DELETE uses config only)', async () => {
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(testUrl, testToken);

      const callArgs = mockedAxios.delete.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs).toHaveLength(2); // URL and config only, no body
      expect(callArgs![0]).toBe(testUrl);
      expect(callArgs![1]).toHaveProperty('headers');
    });

    it('should create Agent with rejectUnauthorized: false', () => {
      axiosDelete(testUrl, testToken);

      expect(MockedAgent).toHaveBeenCalledWith({ rejectUnauthorized: false });
    });
  });

  describe('headers configuration', () => {
    it('should include required headers', async () => {
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(testUrl, testToken);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: {
            'Accept': 'application/json',
            'X-Plex-Token': testToken
          }
        })
      );
    });

    it('should always include Accept header for JSON responses', async () => {
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(testUrl, testToken);

      const callArgs = mockedAxios.delete.mock.calls[0];
      const config = callArgs![1] as any;
      
      expect(config.headers).toHaveProperty('Accept', 'application/json');
    });

    it('should always include X-Plex-Token header', async () => {
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(testUrl, testToken);

      const callArgs = mockedAxios.delete.mock.calls[0];
      const config = callArgs![1] as any;
      
      expect(config.headers).toHaveProperty('X-Plex-Token', testToken);
    });
  });

  describe('HTTPS Agent configuration', () => {
    it('should use custom HTTPS agent', async () => {
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(testUrl, testToken);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          httpsAgent: mockAgent
        })
      );
    });

    it('should configure agent to not reject unauthorized certificates', () => {
      axiosDelete(testUrl, testToken);

      expect(MockedAgent).toHaveBeenCalledWith({ rejectUnauthorized: false });
    });

    it('should create new agent instance for each call', () => {
      MockedAgent.mockClear();

      axiosDelete(testUrl, testToken);
      axiosDelete(testUrl, testToken);
      axiosDelete(testUrl, testToken);

      expect(MockedAgent).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should propagate axios errors', async () => {
      const axiosError = new Error('Network Error');
      mockedAxios.delete.mockRejectedValue(axiosError);

      await expect(axiosDelete(testUrl, testToken)).rejects.toThrow('Network Error');
    });

    it('should propagate HTTP error responses', async () => {
      const httpError = {
        response: {
          status: 404,
          data: { error: 'Resource Not Found' }
        }
      };
      mockedAxios.delete.mockRejectedValue(httpError);

      await expect(axiosDelete(testUrl, testToken)).rejects.toEqual(httpError);
    });

    it('should handle authorization errors', async () => {
      const authError = {
        response: {
          status: 403,
          data: { error: 'Forbidden - Cannot delete resource' }
        }
      };
      mockedAxios.delete.mockRejectedValue(authError);

      await expect(axiosDelete(testUrl, testToken)).rejects.toEqual(authError);
    });

    it('should handle resource already deleted errors', async () => {
      const goneError = {
        response: {
          status: 410,
          data: { error: 'Resource already deleted' }
        }
      };
      mockedAxios.delete.mockRejectedValue(goneError);

      await expect(axiosDelete(testUrl, testToken)).rejects.toEqual(goneError);
    });

    it('should handle connection timeouts', async () => {
      const timeoutError = new Error('timeout exceeded');
      mockedAxios.delete.mockRejectedValue(timeoutError);

      await expect(axiosDelete(testUrl, testToken)).rejects.toThrow('timeout exceeded');
    });
  });

  describe('type safety', () => {
    it('should support generic type parameters', async () => {
      interface DeletePlaylistResponse {
        success: boolean;
        deletedId: number;
        message: string;
      }

      const mockResponse = {
        data: { 
          success: true, 
          deletedId: 123, 
          message: 'Playlist deleted successfully' 
        },
        status: 200,
        statusText: 'OK'
      };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete<DeletePlaylistResponse>(testUrl, testToken);

      expect(result.data.success).toBe(true);
      expect(result.data.deletedId).toBe(123);
      expect(result.status).toBe(200);
    });

    it('should handle complex response types', async () => {
      interface ComplexDeleteResponse {
        operation: {
          type: string;
          resourceId: number;
          timestamp: string;
        };
        affected: {
          playlists: number;
          tracks: number;
        };
        status: string;
      }

      const mockResponse = {
        data: {
          operation: {
            type: 'delete',
            resourceId: 456,
            timestamp: '2024-01-01T00:00:00Z'
          },
          affected: {
            playlists: 1,
            tracks: 10
          },
          status: 'completed'
        }
      };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete<ComplexDeleteResponse>(testUrl, testToken);

      expect(result.data.operation.type).toBe('delete');
      expect(result.data.operation.resourceId).toBe(456);
      expect(result.data.affected.playlists).toBe(1);
      expect(result.data.status).toBe('completed');
    });

    it('should handle void response types (204 No Content)', async () => {
      const mockResponse = {
        data: null,
        status: 204,
        statusText: 'No Content'
      };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete<void>(testUrl, testToken);

      expect(result.status).toBe(204);
      expect(result.data).toBeNull();
    });

    it('should handle empty response types', async () => {
      const mockResponse = {
        data: {},
        status: 200,
        statusText: 'OK'
      };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete<{}>(testUrl, testToken);

      expect(result.status).toBe(200);
      expect(result.data).toEqual({});
    });
  });

  describe('Plex API specific features', () => {
    it('should work with playlist deletion endpoint', async () => {
      const playlistEndpoint = 'https://plex.server.com/playlists/123';
      const mockResponse = { data: { success: true, message: 'Playlist deleted' } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete(playlistEndpoint, testToken);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        playlistEndpoint,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Plex-Token': testToken
          })
        })
      );
      expect((result.data as any).success).toBe(true);
    });

    it('should work with different Plex resource endpoints', async () => {
      const endpoints = [
        'https://plex.server.com/playlists/123',
        'https://plex.server.com/library/metadata/456',
        'https://plex.server.com/library/sections/1/items/789',
        'https://127.0.0.1:32400/playlists/999'
      ];

      const mockResponse = { data: { deleted: true } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      for (const endpoint of endpoints) {
        mockedAxios.delete.mockClear();
        await axiosDelete(endpoint, testToken);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
          endpoint,
          expect.any(Object)
        );
      }
    });

    it('should handle different token formats', async () => {
      const tokens = [
        'simple-token',
        'complex_token-with-underscores',
        '123456789abcdef',
        'token-with-dashes-and-123'
      ];

      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      for (const token of tokens) {
        mockedAxios.delete.mockClear();
        await axiosDelete(testUrl, token);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Plex-Token': token
            })
          })
        );
      }
    });
  });

  describe('performance and reliability', () => {
    it('should handle concurrent requests', async () => {
      const mockResponse = { data: { deleted: true, success: true } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const requests = Array.from({ length: 5 }, (_, i) => 
        axiosDelete(`${testUrl}/${i}`, testToken)
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(5);
      expect(mockedAxios.delete).toHaveBeenCalledTimes(5);
      results.forEach(result => {
        expect((result.data as any).deleted).toBe(true);
      });
    });

    it('should maintain consistent configuration across calls', async () => {
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      // Make multiple calls
      await axiosDelete(testUrl, testToken);
      await axiosDelete(testUrl, testToken);
      await axiosDelete(testUrl, testToken);

      // Each call should have the same configuration structure
      const calls = mockedAxios.delete.mock.calls;
      expect(calls).toHaveLength(3);

      calls.forEach(call => {
        const [url, config] = call;
        expect(url).toBe(testUrl);
        expect(config).toHaveProperty('httpsAgent', mockAgent);
        expect((config as any).headers).toHaveProperty('Accept', 'application/json');
        expect((config as any).headers).toHaveProperty('X-Plex-Token', testToken);
      });
    });

    it('should handle large response payloads for deletion confirmations', async () => {
      const largePayload = {
        deleted: true,
        summary: {
          totalDeleted: 1000,
          details: Array.from({ length: 1000 }, (_, i) => ({ 
            id: i, 
            title: `Deleted Item ${i}`,
            type: 'track'
          }))
        }
      };
      const mockResponse = { data: largePayload };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete(testUrl, testToken);

      expect((result.data as any).summary.details).toHaveLength(1000);
      expect((result.data as any).summary.totalDeleted).toBe(1000);
    });

    it('should handle cascade deletion responses', async () => {
      const cascadeResponse = {
        deleted: true,
        cascaded: {
          playlists: [{ id: 1, title: 'Playlist 1' }],
          tracks: [{ id: 1, title: 'Track 1' }, { id: 2, title: 'Track 2' }]
        }
      };
      const mockResponse = { data: cascadeResponse };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete(testUrl, testToken);

      expect((result.data as any).cascaded.playlists).toHaveLength(1);
      expect((result.data as any).cascaded.tracks).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty token', async () => {
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(testUrl, '');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Plex-Token': ''
          })
        })
      );
    });

    it('should handle special characters in URL', async () => {
      const specialUrl = 'https://plex.server.com/playlists/123?force=true&cascade=true';
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(specialUrl, testToken);

      expect(mockedAxios.delete).toHaveBeenCalledWith(specialUrl, expect.any(Object));
    });

    it('should handle very long URLs', async () => {
      const longUrl = testUrl + '/' + 'a'.repeat(1000);
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(longUrl, testToken);

      expect(mockedAxios.delete).toHaveBeenCalledWith(longUrl, expect.any(Object));
    });

    it('should work with both HTTP and HTTPS URLs', async () => {
      const httpUrl = 'http://plex.server.com/playlists/123';
      const httpsUrl = 'https://plex.server.com/playlists/123';
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(httpUrl, testToken);
      await axiosDelete(httpsUrl, testToken);

      expect(mockedAxios.delete).toHaveBeenCalledTimes(2);
      expect(mockedAxios.delete).toHaveBeenNthCalledWith(1, httpUrl, expect.any(Object));
      expect(mockedAxios.delete).toHaveBeenNthCalledWith(2, httpsUrl, expect.any(Object));
    });

    it('should handle numeric and string IDs in URLs', async () => {
      const urlVariations = [
        'https://plex.server.com/playlists/123',
        'https://plex.server.com/playlists/999999',
        'https://plex.server.com/playlists/abc123',
        'https://plex.server.com/playlists/uuid-style-id'
      ];

      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      for (const url of urlVariations) {
        mockedAxios.delete.mockClear();
        await axiosDelete(url, testToken);

        expect(mockedAxios.delete).toHaveBeenCalledWith(url, expect.any(Object));
      }
    });
  });

  describe('HTTP method characteristics', () => {
    it('should be idempotent - multiple calls should be safe', async () => {
      // First call succeeds
      const successResponse = { data: { deleted: true } };
      // Subsequent calls return 404 (already deleted)
      const notFoundResponse = {
        response: { status: 404, data: { error: 'Not found' } }
      };

      mockedAxios.delete
        .mockResolvedValueOnce(successResponse)
        .mockRejectedValueOnce(notFoundResponse)
        .mockRejectedValueOnce(notFoundResponse);

      // First deletion should succeed
      const result1 = await axiosDelete(testUrl, testToken);
      expect((result1.data as any).deleted).toBe(true);

      // Subsequent deletions should fail with 404
      await expect(axiosDelete(testUrl, testToken)).rejects.toMatchObject({
        response: { status: 404 }
      });
      
      await expect(axiosDelete(testUrl, testToken)).rejects.toMatchObject({
        response: { status: 404 }
      });

      expect(mockedAxios.delete).toHaveBeenCalledTimes(3);
    });

    it('should not have request body unlike POST/PUT', async () => {
      const mockResponse = { data: {} };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await axiosDelete(testUrl, testToken);

      const callArgs = mockedAxios.delete.mock.calls[0];
      // DELETE should only have URL and config, no body parameter
      expect(callArgs).toHaveLength(2);
      expect(typeof callArgs![0]).toBe('string'); // URL
      expect(typeof callArgs![1]).toBe('object'); // Config
      expect(callArgs![1]).toHaveProperty('headers');
    });

    it('should support query parameters for delete operations', async () => {
      const deleteUrl = testUrl + '?force=true&cascade=true';
      const mockResponse = { data: { deleted: true, forced: true } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await axiosDelete(deleteUrl, testToken);

      expect(mockedAxios.delete).toHaveBeenCalledWith(deleteUrl, expect.any(Object));
      expect((result.data as any).deleted).toBe(true);
      expect((result.data as any).forced).toBe(true);
    });
  });
});