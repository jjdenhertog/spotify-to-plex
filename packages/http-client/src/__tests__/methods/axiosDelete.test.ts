/* eslint-disable max-lines, @typescript-eslint/prefer-destructuring */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios first
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Create a mock agent instance that will be returned by the Agent constructor
const mockAgentInstance = { rejectUnauthorized: false };

// Mock https Agent - this creates the agent when the module is imported
vi.mock('node:https', () => ({
    Agent: vi.fn().mockImplementation(() => mockAgentInstance)
}));

// Now import the function under test (after mocks are set up)
const { axiosDelete } = await import('../../methods/axiosDelete');

describe('axiosDelete', () => {
    const testUrl = 'https://api.plex.com/playlists/123';
    const testToken = 'test-plex-token';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('basic functionality', () => {
        it('should make DELETE request with correct parameters', async () => {
            const mockResponse = { data: { deleted: true } };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            const result = await axiosDelete(testUrl, testToken);

            expect(mockedAxios.delete).toHaveBeenCalledWith(
                testUrl,
                {
                    httpsAgent: mockAgentInstance,
                    headers: {
                        'Accept': 'application/json',
                        'X-Plex-Token': testToken
                    }
                }
            );
            expect(result).toBe(mockResponse);
        });

        it('should use HTTPS agent with rejectUnauthorized: false', async () => {
            const mockResponse = { data: {} };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            await axiosDelete(testUrl, testToken);

            expect(mockedAxios.delete).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    httpsAgent: mockAgentInstance
                })
            );
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

            const [, config] = mockedAxios.delete.mock.calls[0]!;
            expect((config as any).headers).toHaveProperty('Accept', 'application/json');
        });

        it('should always include X-Plex-Token header', async () => {
            const mockResponse = { data: {} };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            await axiosDelete(testUrl, testToken);

            const [, config] = mockedAxios.delete.mock.calls[0]!;
            expect((config as any).headers).toHaveProperty('X-Plex-Token', testToken);
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
                    data: { error: 'Not Found' }
                }
            };
            mockedAxios.delete.mockRejectedValue(httpError);

            await expect(axiosDelete(testUrl, testToken)).rejects.toEqual(httpError);
        });

        it('should handle authorization errors', async () => {
            const authError = {
                response: {
                    status: 401,
                    data: { error: 'Unauthorized' }
                }
            };
            mockedAxios.delete.mockRejectedValue(authError);

            await expect(axiosDelete(testUrl, testToken)).rejects.toEqual(authError);
        });

        it('should handle not found errors', async () => {
            const notFoundError = {
                response: {
                    status: 404,
                    data: { error: 'Playlist not found' }
                }
            };
            mockedAxios.delete.mockRejectedValue(notFoundError);

            await expect(axiosDelete(testUrl, testToken)).rejects.toEqual(notFoundError);
        });

        it('should handle connection timeouts', async () => {
            const timeoutError = new Error('Request timed out');
            mockedAxios.delete.mockRejectedValue(timeoutError);

            await expect(axiosDelete(testUrl, testToken)).rejects.toThrow('Request timed out');
        });
    });

    describe('type safety', () => {
        it('should support generic type parameters', async () => {
            type DeleteResponse = {
                success: boolean;
                message: string;
            }

            const mockResponse = {
                data: { success: true, message: 'deleted' },
                status: 200,
                statusText: 'OK'
            };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            const result = await axiosDelete<DeleteResponse>(testUrl, testToken);

            expect(result.data).toEqual({ success: true, message: 'deleted' });
            expect(result.status).toBe(200);
        });

        it('should handle complex response types', async () => {
            type PlaylistDeleteResponse = {
                playlist: {
                    id: string;
                    deleted: boolean;
                }
                affectedTracks: number;
            }

            const mockResponse = {
                data: {
                    playlist: { id: '123', deleted: true },
                    affectedTracks: 25
                }
            };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            const result = await axiosDelete<PlaylistDeleteResponse>(testUrl, testToken);

            expect(result.data.playlist.deleted).toBe(true);
            expect(result.data.affectedTracks).toBe(25);
        });

        it('should handle void response types', async () => {
            const mockResponse = {
                data: undefined,
                status: 204,
                statusText: 'No Content'
            };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            const result = await axiosDelete<undefined>(testUrl, testToken);

            expect(result.status).toBe(204);
            expect(result.data).toBeUndefined();
        });
    });

    describe('Plex API specific features', () => {
        it('should work with playlist deletion endpoint', async () => {
            const mockResponse = { data: { success: true } };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            await axiosDelete(testUrl, testToken);

            expect(mockedAxios.delete).toHaveBeenCalledWith(testUrl, expect.any(Object));
        });

        it('should work with different Plex resource endpoints', async () => {
            const endpoints = [
                'https://plex.server.com/playlists/123',
                'https://plex.server.com/library/metadata/456',
                'https://127.0.0.1:32400/library/sections/1/items/789',
                'https://plex.server.com/accounts/friends/987'
            ];

            const mockResponse = { data: {} };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            for (const endpoint of endpoints) {
                mockedAxios.delete.mockClear();
                await axiosDelete(endpoint, testToken);

                expect(mockedAxios.delete).toHaveBeenCalledWith(endpoint, expect.any(Object));
            }
        });

        it('should handle different token formats', async () => {
            const tokens = [
                'simple-token',
                'complex_token-with-underscores',
                '123456789',
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
            const mockResponse = { data: { result: 'deleted' } };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            const requests = Array.from({ length: 5 }, (_, i) => 
                axiosDelete(testUrl.replace('123', i.toString()), testToken)
            );

            const results = await Promise.all(requests);

            expect(results).toHaveLength(5);
            expect(mockedAxios.delete).toHaveBeenCalledTimes(5);
            results.forEach(result => {
                expect((result.data as any).result).toBe('deleted');
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
            const {calls} = mockedAxios.delete.mock;
            expect(calls).toHaveLength(3);

            calls.forEach(([url, config]) => {
                expect(url).toBe(testUrl);
                expect(config).toHaveProperty('httpsAgent', mockAgentInstance);
                expect((config as any).headers).toHaveProperty('Accept', 'application/json');
                expect((config as any).headers).toHaveProperty('X-Plex-Token', testToken);
            });
        });

        it('should handle network retries gracefully', async () => {
            const networkError = new Error('ECONNRESET');
            mockedAxios.delete.mockRejectedValue(networkError);

            await expect(axiosDelete(testUrl, testToken)).rejects.toThrow('ECONNRESET');
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
            const specialUrl = 'https://plex.server.com/playlists/123%20test';
            const mockResponse = { data: {} };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            await axiosDelete(specialUrl, testToken);

            expect(mockedAxios.delete).toHaveBeenCalledWith(specialUrl, expect.any(Object));
        });

        it('should handle very long URLs', async () => {
            const longUrl = `${testUrl  }/${'a'.repeat(2000)}`;
            const mockResponse = { data: {} };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            await axiosDelete(longUrl, testToken);

            expect(mockedAxios.delete).toHaveBeenCalledWith(longUrl, expect.any(Object));
        });

        it('should work with both HTTP and HTTPS URLs', async () => {
            const urls = [
                'https://secure.plex.com/playlists/123',
                'http://local.plex.com:32400/playlists/123'
            ];

            const mockResponse = { data: {} };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            for (const url of urls) {
                mockedAxios.delete.mockClear();
                await axiosDelete(url, testToken);

                expect(mockedAxios.delete).toHaveBeenCalledWith(url, expect.any(Object));
            }
        });

        it('should handle numeric IDs in URLs', async () => {
            const numericUrls = [
                'https://plex.server.com/playlists/123',
                'https://plex.server.com/playlists/999999',
                'https://plex.server.com/playlists/0'
            ];

            const mockResponse = { data: {} };
            mockedAxios.delete.mockResolvedValue(mockResponse);

            for (const url of numericUrls) {
                mockedAxios.delete.mockClear();
                await axiosDelete(url, testToken);

                expect(mockedAxios.delete).toHaveBeenCalledWith(url, expect.any(Object));
            }
        });
    });
});