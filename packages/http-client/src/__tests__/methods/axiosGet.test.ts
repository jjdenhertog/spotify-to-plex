import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { Agent } from 'node:https';
import { axiosGet } from '../../methods/axiosGet';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock https Agent
vi.mock('node:https', () => ({
    Agent: vi.fn()
}));
const MockedAgent = vi.mocked(Agent);

describe('axiosGet', () => {
    const testUrl = 'https://api.plex.com/test';
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
        it('should make GET request with correct parameters', async () => {
            const mockResponse = { data: { success: true } };
            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await axiosGet(testUrl, testToken);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                testUrl,
                {
                    timeout: 10_000,
                    httpsAgent: mockAgent,
                    headers: {
                        'X-Plex-Token': testToken
                    }
                }
            );
            expect(result).toBe(mockResponse);
        });

        it('should use default timeout of 10 seconds', async () => {
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(testUrl, testToken);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    timeout: 10_000
                })
            );
        });

        it('should create Agent with rejectUnauthorized: false', () => {
            axiosGet(testUrl, testToken);

            expect(MockedAgent).toHaveBeenCalledWith({ rejectUnauthorized: false });
        });
    });

    describe('configuration merging', () => {
        it('should merge custom config with defaults', async () => {
            const customConfig = {
                maxRedirects: 5,
                validateStatus: (status: number) => status < 400
            };
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(testUrl, testToken, customConfig);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                testUrl,
                {
                    ...customConfig,
                    timeout: 10_000,
                    httpsAgent: mockAgent,
                    headers: {
                        'X-Plex-Token': testToken
                    }
                }
            );
        });

        it('should allow custom timeout to override default', async () => {
            const customConfig = { timeout: 5000 };
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(testUrl, testToken, customConfig);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    timeout: 5000 // Custom timeout should override
                })
            );
        });

        it('should merge custom headers with Plex token header', async () => {
            const customConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Custom-Header': 'custom-value'
                }
            };
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(testUrl, testToken, customConfig);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/json',
                        'Custom-Header': 'custom-value',
                        'X-Plex-Token': testToken
                    }
                })
            );
        });

        it('should not allow custom headers to override Plex token', async () => {
            const customConfig = {
                headers: {
                    'X-Plex-Token': 'should-be-overridden'
                }
            };
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(testUrl, testToken, customConfig);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    headers: {
                        'X-Plex-Token': testToken // Original token should be preserved
                    }
                })
            );
        });

        it('should preserve httpsAgent from default configuration', async () => {
            const customConfig = { maxRedirects: 3 };
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(testUrl, testToken, customConfig);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    httpsAgent: mockAgent,
                    maxRedirects: 3
                })
            );
        });
    });

    describe('error handling', () => {
        it('should propagate axios errors', async () => {
            const axiosError = new Error('Network Error');
            mockedAxios.get.mockRejectedValue(axiosError);

            await expect(axiosGet(testUrl, testToken)).rejects.toThrow('Network Error');
        });

        it('should propagate HTTP error responses', async () => {
            const httpError = {
                response: {
                    status: 404,
                    data: { error: 'Not Found' }
                }
            };
            mockedAxios.get.mockRejectedValue(httpError);

            await expect(axiosGet(testUrl, testToken)).rejects.toEqual(httpError);
        });

        it('should handle timeout errors', async () => {
            const timeoutError = new Error('timeout of 10000ms exceeded');
            mockedAxios.get.mockRejectedValue(timeoutError);

            await expect(axiosGet(testUrl, testToken)).rejects.toThrow('timeout of 10000ms exceeded');
        });

        it('should handle SSL/TLS errors gracefully due to rejectUnauthorized: false', () => {
            // Verify that Agent is configured to not reject unauthorized certificates
            axiosGet(testUrl, testToken);
            expect(MockedAgent).toHaveBeenCalledWith({ rejectUnauthorized: false });
        });
    });

    describe('type safety', () => {
        it('should support generic type parameters', async () => {
      type TestResponse = {
        id: number;
        name: string;
      }

      const mockResponse = {
          data: { id: 1, name: 'test' },
          status: 200,
          statusText: 'OK'
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await axiosGet<TestResponse>(testUrl, testToken);

      expect(result.data).toEqual({ id: 1, name: 'test' });
      expect(result.status).toBe(200);
        });

        it('should handle complex response types', async () => {
      type ComplexResponse = {
        users: { id: number; name: string }[];
        total: number;
        hasMore: boolean;
      }

      const mockResponse = {
          data: {
              users: [{ id: 1, name: 'User 1' }],
              total: 1,
              hasMore: false
          }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await axiosGet<ComplexResponse>(testUrl, testToken);

      expect(result.data.users).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.hasMore).toBe(false);
        });
    });

    describe('Plex API specific features', () => {
        it('should always include X-Plex-Token header', async () => {
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(testUrl, testToken);

            const callArgs = mockedAxios.get.mock.calls[0];
            const config = callArgs![1] as any;
      
            expect(config.headers).toHaveProperty('X-Plex-Token', testToken);
        });

        it('should handle different token formats', async () => {
            const tokens = [
                'simple-token',
                'complex_token-with-underscores',
                '123456789',
                'token-with-dashes-and-123'
            ];

            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            for (const token of tokens) {
                mockedAxios.get.mockClear();
                await axiosGet(testUrl, token);

                expect(mockedAxios.get).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            'X-Plex-Token': token
                        })
                    })
                );
            }
        });

        it('should work with different Plex API endpoints', async () => {
            const endpoints = [
                'https://plex.server.com/library/sections',
                'https://plex.server.com/playlists',
                'https://plex.server.com/search?query=test',
                'https://127.0.0.1:32400/library/metadata/123'
            ];

            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            for (const endpoint of endpoints) {
                mockedAxios.get.mockClear();
                await axiosGet(endpoint, testToken);

                expect(mockedAxios.get).toHaveBeenCalledWith(
                    endpoint,
                    expect.any(Object)
                );
            }
        });
    });

    describe('performance and reliability', () => {
        it('should handle concurrent requests', async () => {
            const mockResponse = { data: { result: 'success' } };
            mockedAxios.get.mockResolvedValue(mockResponse);

            const requests = Array.from({ length: 10 }, (_, i) => 
                axiosGet(`${testUrl}/${i}`, testToken)
            );

            const results = await Promise.all(requests);

            expect(results).toHaveLength(10);
            expect(mockedAxios.get).toHaveBeenCalledTimes(10);
            results.forEach(result => {
                expect((result.data as any).result).toBe('success');
            });
        });

        it('should handle large response data', async () => {
            const largeData = Array.from({ length: 10_000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }));
            const mockResponse = { data: largeData };
            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await axiosGet(testUrl, testToken);

            expect((result.data as any)).toHaveLength(10_000);
            expect((result.data as any)[0]).toHaveProperty('id', 0);
        });

        it('should maintain consistent configuration across calls', async () => {
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            // Make multiple calls
            await axiosGet(testUrl, testToken);
            await axiosGet(testUrl, testToken);
            await axiosGet(testUrl, testToken);

            // Each call should have the same configuration structure
            const {calls} = mockedAxios.get.mock;
            expect(calls).toHaveLength(3);

            calls.forEach(call => {
                const config = call[1] as any;
                expect(config).toHaveProperty('timeout', 10_000);
                expect(config).toHaveProperty('httpsAgent', mockAgent);
                expect(config.headers).toHaveProperty('X-Plex-Token', testToken);
            });
        });
    });

    describe('edge cases', () => {
        it('should handle empty token', async () => {
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(testUrl, '');

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Plex-Token': ''
                    })
                })
            );
        });

        it('should handle very long URLs', async () => {
            const longUrl = `${testUrl  }/${  'a'.repeat(2000)}`;
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(longUrl, testToken);

            expect(mockedAxios.get).toHaveBeenCalledWith(longUrl, expect.any(Object));
        });

        it('should handle special characters in URL', async () => {
            const specialUrl = 'https://plex.server.com/search?query=hello%20world&type=track';
            const mockResponse = { data: {} };
            mockedAxios.get.mockResolvedValue(mockResponse);

            await axiosGet(specialUrl, testToken);

            expect(mockedAxios.get).toHaveBeenCalledWith(specialUrl, expect.any(Object));
        });
    });
});