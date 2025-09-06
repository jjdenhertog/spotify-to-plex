/* eslint-disable max-lines, @typescript-eslint/prefer-destructuring */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { Agent } from 'node:https';
import { axiosPost } from '../../methods/axiosPost';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock https Agent
vi.mock('node:https', () => ({
    Agent: vi.fn()
}));
const MockedAgent = vi.mocked(Agent);

describe('axiosPost', () => {
    const testUrl = 'https://api.plex.com/playlists';
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
        it('should make POST request with correct parameters', async () => {
            const mockResponse = { data: { id: 123, created: true } };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await axiosPost(testUrl, testToken);

            expect(mockedAxios.post).toHaveBeenCalledWith(
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
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(testUrl, testToken);

            const [, body] = mockedAxios.post.mock.calls[0]!;
      
            expect(body).toEqual({});
        });

        it('should create Agent with rejectUnauthorized: false', () => {
            axiosPost(testUrl, testToken);

            expect(MockedAgent).toHaveBeenCalledWith({ rejectUnauthorized: false });
        });
    });

    describe('headers configuration', () => {
        it('should include required headers', async () => {
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(testUrl, testToken);

            expect(mockedAxios.post).toHaveBeenCalledWith(
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
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(testUrl, testToken);

            // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
            const [, , config] = mockedAxios.post.mock.calls[0]!;
      
            expect((config as any).headers).toHaveProperty('Accept', 'application/json');
        });

        it('should always include X-Plex-Token header', async () => {
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(testUrl, testToken);

            // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
            const [, , config] = mockedAxios.post.mock.calls[0]!;
      
            expect((config as any).headers).toHaveProperty('X-Plex-Token', testToken);
        });
    });

    describe('HTTPS Agent configuration', () => {
        it('should use custom HTTPS agent', async () => {
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(testUrl, testToken);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    httpsAgent: mockAgent
                })
            );
        });

        it('should configure agent to not reject unauthorized certificates', () => {
            axiosPost(testUrl, testToken);

            expect(MockedAgent).toHaveBeenCalledWith({ rejectUnauthorized: false });
        });

        it('should create new agent instance for each call', () => {
            MockedAgent.mockClear();

            axiosPost(testUrl, testToken);
            axiosPost(testUrl, testToken);
            axiosPost(testUrl, testToken);

            expect(MockedAgent).toHaveBeenCalledTimes(3);
        });
    });

    describe('error handling', () => {
        it('should propagate axios errors', async () => {
            const axiosError = new Error('Network Error');
            mockedAxios.post.mockRejectedValue(axiosError);

            await expect(axiosPost(testUrl, testToken)).rejects.toThrow('Network Error');
        });

        it('should propagate HTTP error responses', async () => {
            const httpError = {
                response: {
                    status: 401,
                    data: { error: 'Unauthorized' }
                }
            };
            mockedAxios.post.mockRejectedValue(httpError);

            await expect(axiosPost(testUrl, testToken)).rejects.toEqual(httpError);
        });

        it('should handle server errors', async () => {
            const serverError = {
                response: {
                    status: 500,
                    data: { error: 'Internal Server Error' }
                }
            };
            mockedAxios.post.mockRejectedValue(serverError);

            await expect(axiosPost(testUrl, testToken)).rejects.toEqual(serverError);
        });

        it('should handle connection timeouts', async () => {
            const timeoutError = new Error('timeout exceeded');
            mockedAxios.post.mockRejectedValue(timeoutError);

            await expect(axiosPost(testUrl, testToken)).rejects.toThrow('timeout exceeded');
        });
    });

    describe('type safety', () => {
        it('should support generic type parameters', async () => {
      type CreatePlaylistResponse = {
        id: number;
        title: string;
        created: boolean;
      }

      const mockResponse = {
          data: { id: 123, title: 'New Playlist', created: true },
          status: 201,
          statusText: 'Created'
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await axiosPost<CreatePlaylistResponse>(testUrl, testToken);

      expect(result.data).toEqual({ id: 123, title: 'New Playlist', created: true });
      expect(result.status).toBe(201);
        });

        it('should handle complex response types', async () => {
      type ComplexCreateResponse = {
        playlist: {
          id: number;
          metadata: {
            title: string;
            trackCount: number;
            duration: number;
          };
        };
        status: string;
      }

      const mockResponse = {
          data: {
              playlist: {
                  id: 456,
                  metadata: {
                      title: 'Complex Playlist',
                      trackCount: 0,
                      duration: 0
                  }
              },
              status: 'created'
          }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await axiosPost<ComplexCreateResponse>(testUrl, testToken);

      expect(result.data.playlist.id).toBe(456);
      expect(result.data.playlist.metadata.title).toBe('Complex Playlist');
      expect(result.data.status).toBe('created');
        });

        it('should handle void response types', async () => {
            const mockResponse = {
                data: null,
                status: 204,
                statusText: 'No Content'
            };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await axiosPost<undefined>(testUrl, testToken);

            expect(result.status).toBe(204);
            expect(result.data).toBeNull();
        });
    });

    describe('Plex API specific features', () => {
        it('should work with playlist creation endpoint', async () => {
            const playlistEndpoint = 'https://plex.server.com/playlists';
            const mockResponse = { data: { id: 1, title: 'My Playlist' } };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await axiosPost(playlistEndpoint, testToken);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                playlistEndpoint,
                {},
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Plex-Token': testToken
                    })
                })
            );
            expect((result.data as any).id).toBe(1);
        });

        it('should work with different Plex server URLs', async () => {
            const serverUrls = [
                'https://127.0.0.1:32400/playlists',
                'https://plex.myserver.com:32400/playlists',
                'https://192.168.1.100:32400/playlists',
                'http://localhost:32400/playlists'
            ];

            const mockResponse = { data: { created: true } };
            mockedAxios.post.mockResolvedValue(mockResponse);

            for (const url of serverUrls) {
                mockedAxios.post.mockClear();
                await axiosPost(url, testToken);

                expect(mockedAxios.post).toHaveBeenCalledWith(
                    url,
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
            mockedAxios.post.mockResolvedValue(mockResponse);

            for (const token of tokens) {
                mockedAxios.post.mockClear();
                await axiosPost(testUrl, token);

                expect(mockedAxios.post).toHaveBeenCalledWith(
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
            const mockResponse = { data: { id: 'unique-id' } };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const requests = Array.from({ length: 5 }, (_, i) => 
                axiosPost(`${testUrl}/${i}`, testToken)
            );

            const results = await Promise.all(requests);

            expect(results).toHaveLength(5);
            expect(mockedAxios.post).toHaveBeenCalledTimes(5);
            results.forEach(result => {
                expect((result.data as any).id).toBe('unique-id');
            });
        });

        it('should maintain consistent configuration across calls', async () => {
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            // Make multiple calls
            await axiosPost(testUrl, testToken);
            await axiosPost(testUrl, testToken);
            await axiosPost(testUrl, testToken);

            // Each call should have the same configuration structure
            const {calls} = mockedAxios.post.mock;
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
                items: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` })),
                total: 1000
            };
            const mockResponse = { data: largePayload };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await axiosPost(testUrl, testToken);

            expect((result.data as any).items).toHaveLength(1000);
            expect((result.data as any).total).toBe(1000);
        });
    });

    describe('edge cases', () => {
        it('should handle empty token', async () => {
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(testUrl, '');

            expect(mockedAxios.post).toHaveBeenCalledWith(
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
            const specialUrl = 'https://plex.server.com/playlists?title=My%20Playlist&type=audio';
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(specialUrl, testToken);

            expect(mockedAxios.post).toHaveBeenCalledWith(specialUrl, {}, expect.any(Object));
        });

        it('should handle very long URLs', async () => {
            const longUrl = `${testUrl  }/${  'a'.repeat(1000)}`;
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(longUrl, testToken);

            expect(mockedAxios.post).toHaveBeenCalledWith(longUrl, {}, expect.any(Object));
        });

        it('should work with HTTP and HTTPS URLs', async () => {
            const httpUrl = 'http://plex.server.com/playlists';
            const httpsUrl = 'https://plex.server.com/playlists';
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(httpUrl, testToken);
            await axiosPost(httpsUrl, testToken);

            expect(mockedAxios.post).toHaveBeenCalledTimes(2);
            expect(mockedAxios.post).toHaveBeenNthCalledWith(1, httpUrl, {}, expect.any(Object));
            expect(mockedAxios.post).toHaveBeenNthCalledWith(2, httpsUrl, {}, expect.any(Object));
        });
    });

    describe('request body consistency', () => {
        it('should always send empty object as body', async () => {
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(testUrl, testToken);

            const [, body] = mockedAxios.post.mock.calls[0]!;
      
            expect(body).toEqual({});
            expect(typeof body).toBe('object');
            expect(Object.keys(body as object)).toHaveLength(0);
        });

        it('should send same body structure across multiple calls', async () => {
            const mockResponse = { data: {} };
            mockedAxios.post.mockResolvedValue(mockResponse);

            await axiosPost(testUrl, testToken);
            await axiosPost(testUrl, testToken);
            await axiosPost(testUrl, testToken);

            const {calls} = mockedAxios.post.mock;
            calls.forEach(([, body]) => {
                expect(body).toEqual({});
            });
        });
    });
});