/* eslint-disable max-lines, @typescript-eslint/prefer-destructuring */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { Agent } from 'node:https';
import { axiosPut } from '../../methods/axiosPut';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock https Agent
vi.mock('node:https', () => ({
    Agent: vi.fn()
}));
const MockedAgent = vi.mocked(Agent);

describe('axiosPut', () => {
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
        it('should make PUT request with correct parameters', async () => {
            const mockResponse = { data: { id: 123, updated: true } };
            mockedAxios.put.mockResolvedValue(mockResponse);

            const result = await axiosPut(testUrl, testToken);

            expect(mockedAxios.put).toHaveBeenCalledWith(
                testUrl,
                {}, // Empty body
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

        it('should use empty object as request body', async () => {
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(testUrl, testToken);

            const [, body] = mockedAxios.put.mock.calls[0]!;
      
            expect(body).toEqual({});
        });

        it('should create Agent with rejectUnauthorized: false', () => {
            axiosPut(testUrl, testToken);

            expect(MockedAgent).toHaveBeenCalledWith({ rejectUnauthorized: false });
        });
    });

    describe('headers configuration', () => {
        it('should include required headers', async () => {
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(testUrl, testToken);

            expect(mockedAxios.put).toHaveBeenCalledWith(
                expect.anything(),
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
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(testUrl, testToken);

            // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
            const [, , config] = mockedAxios.put.mock.calls[0]!;
      
            expect((config as any).headers).toHaveProperty('Accept', 'application/json');
        });

        it('should always include X-Plex-Token header', async () => {
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(testUrl, testToken);

            // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
            const [, , config] = mockedAxios.put.mock.calls[0]!;
      
            expect((config as any).headers).toHaveProperty('X-Plex-Token', testToken);
        });
    });

    describe('HTTPS Agent configuration', () => {
        it('should use custom HTTPS agent', async () => {
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(testUrl, testToken);

            expect(mockedAxios.put).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    httpsAgent: mockAgent
                })
            );
        });

        it('should configure agent to not reject unauthorized certificates', () => {
            axiosPut(testUrl, testToken);

            expect(MockedAgent).toHaveBeenCalledWith({ rejectUnauthorized: false });
        });

        it('should create new agent instance for each call', () => {
            MockedAgent.mockClear();

            axiosPut(testUrl, testToken);
            axiosPut(testUrl, testToken);
            axiosPut(testUrl, testToken);

            expect(MockedAgent).toHaveBeenCalledTimes(3);
        });
    });

    describe('error handling', () => {
        it('should propagate axios errors', async () => {
            const axiosError = new Error('Network Error');
            mockedAxios.put.mockRejectedValue(axiosError);

            await expect(axiosPut(testUrl, testToken)).rejects.toThrow('Network Error');
        });

        it('should propagate HTTP error responses', async () => {
            const httpError = {
                response: {
                    status: 404,
                    data: { error: 'Playlist Not Found' }
                }
            };
            mockedAxios.put.mockRejectedValue(httpError);

            await expect(axiosPut(testUrl, testToken)).rejects.toEqual(httpError);
        });

        it('should handle authorization errors', async () => {
            const authError = {
                response: {
                    status: 401,
                    data: { error: 'Unauthorized' }
                }
            };
            mockedAxios.put.mockRejectedValue(authError);

            await expect(axiosPut(testUrl, testToken)).rejects.toEqual(authError);
        });

        it('should handle conflict errors', async () => {
            const conflictError = {
                response: {
                    status: 409,
                    data: { error: 'Resource conflict' }
                }
            };
            mockedAxios.put.mockRejectedValue(conflictError);

            await expect(axiosPut(testUrl, testToken)).rejects.toEqual(conflictError);
        });

        it('should handle connection timeouts', async () => {
            const timeoutError = new Error('timeout exceeded');
            mockedAxios.put.mockRejectedValue(timeoutError);

            await expect(axiosPut(testUrl, testToken)).rejects.toThrow('timeout exceeded');
        });
    });

    describe('type safety', () => {
        it('should support generic type parameters', async () => {
      type UpdatePlaylistResponse = {
        id: number;
        title: string;
        updated: boolean;
        lastModified: string;
      }

      const mockResponse = {
          data: { 
              id: 123, 
              title: 'Updated Playlist', 
              updated: true,
              lastModified: '2024-01-01T00:00:00Z'
          },
          status: 200,
          statusText: 'OK'
      };
      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await axiosPut<UpdatePlaylistResponse>(testUrl, testToken);

      expect((result.data as any).id).toBe(123);
      expect((result.data as any).updated).toBe(true);
      expect(result.status).toBe(200);
        });

        it('should handle complex response types', async () => {
      type ComplexUpdateResponse = {
        playlist: {
          id: number;
          metadata: {
            title: string;
            trackCount: number;
            lastUpdated: string;
          };
          tracks: {
            id: number;
            title: string;
          }[];
        };
        status: string;
      }

      const mockResponse = {
          data: {
              playlist: {
                  id: 456,
                  metadata: {
                      title: 'Complex Updated Playlist',
                      trackCount: 10,
                      lastUpdated: '2024-01-01T00:00:00Z'
                  },
                  tracks: [
                      { id: 1, title: 'Track 1' },
                      { id: 2, title: 'Track 2' }
                  ]
              },
              status: 'updated'
          }
      };
      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await axiosPut<ComplexUpdateResponse>(testUrl, testToken);

      expect(result.data.playlist.id).toBe(456);
      expect(result.data.playlist.metadata.trackCount).toBe(10);
      expect(result.data.playlist.tracks).toHaveLength(2);
      expect(result.data.status).toBe('updated');
        });

        it('should handle void response types', async () => {
            const mockResponse = {
                data: null,
                status: 204,
                statusText: 'No Content'
            };
            mockedAxios.put.mockResolvedValue(mockResponse);

            const result = await axiosPut<undefined>(testUrl, testToken);

            expect(result.status).toBe(204);
            expect(result.data).toBeNull();
        });
    });

    describe('Plex API specific features', () => {
        it('should work with playlist update endpoint', async () => {
            const playlistEndpoint = 'https://plex.server.com/playlists/123';
            const mockResponse = { data: { id: 123, title: 'Updated Playlist' } };
            mockedAxios.put.mockResolvedValue(mockResponse);

            const result = await axiosPut(playlistEndpoint, testToken);

            expect(mockedAxios.put).toHaveBeenCalledWith(
                playlistEndpoint,
                {},
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Plex-Token': testToken
                    })
                })
            );
            expect((result.data as any).id).toBe(123);
        });

        it('should work with different Plex resource endpoints', async () => {
            const endpoints = [
                'https://plex.server.com/playlists/123',
                'https://plex.server.com/library/metadata/456',
                'https://plex.server.com/library/sections/1/refresh',
                'https://127.0.0.1:32400/playlists/789'
            ];

            const mockResponse = { data: { updated: true } };
            mockedAxios.put.mockResolvedValue(mockResponse);

            for (const endpoint of endpoints) {
                mockedAxios.put.mockClear();
                await axiosPut(endpoint, testToken);

                expect(mockedAxios.put).toHaveBeenCalledWith(
                    endpoint,
                    {},
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
            mockedAxios.put.mockResolvedValue(mockResponse);

            for (const token of tokens) {
                mockedAxios.put.mockClear();
                await axiosPut(testUrl, token);

                expect(mockedAxios.put).toHaveBeenCalledWith(
                    expect.anything(),
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
            const mockResponse = { data: { id: 'unique-id', updated: true } };
            mockedAxios.put.mockResolvedValue(mockResponse);

            const requests = Array.from({ length: 5 }, (_, i) => 
                axiosPut(`${testUrl}/${i}`, testToken)
            );

            const results = await Promise.all(requests);

            expect(results).toHaveLength(5);
            expect(mockedAxios.put).toHaveBeenCalledTimes(5);
            results.forEach(result => {
                expect((result.data as any).updated).toBe(true);
            });
        });

        it('should maintain consistent configuration across calls', async () => {
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            // Make multiple calls
            await axiosPut(testUrl, testToken);
            await axiosPut(testUrl, testToken);
            await axiosPut(testUrl, testToken);

            // Each call should have the same configuration structure
            const {calls} = mockedAxios.put.mock;
            expect(calls).toHaveLength(3);

            calls.forEach(([url, body, config]) => {
                expect(url).toBe(testUrl);
                expect(body).toEqual({});
                expect(config).toHaveProperty('httpsAgent', mockAgent);
                expect((config as any).headers).toHaveProperty('Accept', 'application/json');
                expect((config as any).headers).toHaveProperty('X-Plex-Token', testToken);
            });
        });

        it('should handle large response payloads', async () => {
            const largePayload = {
                playlist: {
                    id: 123,
                    tracks: Array.from({ length: 1000 }, (_, i) => ({ 
                        id: i, 
                        title: `Track ${i}`,
                        duration: 180_000 
                    }))
                },
                total: 1000
            };
            const mockResponse = { data: largePayload };
            mockedAxios.put.mockResolvedValue(mockResponse);

            const result = await axiosPut(testUrl, testToken);

            expect((result.data as any).playlist.tracks).toHaveLength(1000);
            expect((result.data as any).total).toBe(1000);
        });

        it('should handle network retries gracefully', async () => {
            // First call fails, second succeeds (simulating retry logic at higher level)
            const error = new Error('Network timeout');
            const success = { data: { updated: true } };
      
            mockedAxios.put
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce(success);

            await expect(axiosPut(testUrl, testToken)).rejects.toThrow('Network timeout');
      
            const result = await axiosPut(testUrl, testToken);
            expect((result.data as any).updated).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle empty token', async () => {
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(testUrl, '');

            expect(mockedAxios.put).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Plex-Token': ''
                    })
                })
            );
        });

        it('should handle special characters in URL', async () => {
            const specialUrl = 'https://plex.server.com/playlists/123?title=My%20Updated%20Playlist&type=audio';
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(specialUrl, testToken);

            expect(mockedAxios.put).toHaveBeenCalledWith(specialUrl, {}, expect.any(Object));
        });

        it('should handle very long URLs', async () => {
            const longUrl = `${testUrl  }/${  'a'.repeat(1000)}`;
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(longUrl, testToken);

            expect(mockedAxios.put).toHaveBeenCalledWith(longUrl, {}, expect.any(Object));
        });

        it('should work with both HTTP and HTTPS URLs', async () => {
            const httpUrl = 'http://plex.server.com/playlists/123';
            const httpsUrl = 'https://plex.server.com/playlists/123';
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(httpUrl, testToken);
            await axiosPut(httpsUrl, testToken);

            expect(mockedAxios.put).toHaveBeenCalledTimes(2);
            expect(mockedAxios.put).toHaveBeenNthCalledWith(1, httpUrl, {}, expect.any(Object));
            expect(mockedAxios.put).toHaveBeenNthCalledWith(2, httpsUrl, {}, expect.any(Object));
        });

        it('should handle numeric IDs in URLs', async () => {
            const numericUrls = [
                'https://plex.server.com/playlists/123',
                'https://plex.server.com/playlists/999999',
                'https://plex.server.com/playlists/0'
            ];

            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            for (const url of numericUrls) {
                mockedAxios.put.mockClear();
                await axiosPut(url, testToken);

                expect(mockedAxios.put).toHaveBeenCalledWith(url, {}, expect.any(Object));
            }
        });
    });

    describe('request body consistency', () => {
        it('should always send empty object as body', async () => {
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(testUrl, testToken);

            const [, body] = mockedAxios.put.mock.calls[0]!;
      
            expect(body).toEqual({});
            expect(typeof body).toBe('object');
            expect(Object.keys(body as object)).toHaveLength(0);
        });

        it('should send same body structure across multiple calls', async () => {
            const mockResponse = { data: {} };
            mockedAxios.put.mockResolvedValue(mockResponse);

            await axiosPut(testUrl, testToken);
            await axiosPut(testUrl, testToken);
            await axiosPut(testUrl, testToken);

            const {calls} = mockedAxios.put.mock;
            calls.forEach(([, body]) => {
                expect(body).toEqual({});
            });
        });
    });

    describe('idempotency characteristics', () => {
        it('should be idempotent - multiple calls with same parameters', async () => {
            const mockResponse = { data: { id: 123, updated: true } };
            mockedAxios.put.mockResolvedValue(mockResponse);

            const result1 = await axiosPut(testUrl, testToken);
            const result2 = await axiosPut(testUrl, testToken);
            const result3 = await axiosPut(testUrl, testToken);

            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
            expect(mockedAxios.put).toHaveBeenCalledTimes(3);
        });
    });
});