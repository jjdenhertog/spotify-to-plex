import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosRequest } from '../AxiosRequest';
import * as axiosGetModule from '../methods/axiosGet';
import * as axiosPostModule from '../methods/axiosPost';
import * as axiosPutModule from '../methods/axiosPut';
import * as axiosDeleteModule from '../methods/axiosDelete';

// Mock all the method modules
vi.mock('../methods/axiosGet');
vi.mock('../methods/axiosPost');
vi.mock('../methods/axiosPut');
vi.mock('../methods/axiosDelete');

const mockAxiosGet = vi.mocked(axiosGetModule.axiosGet);
const mockAxiosPost = vi.mocked(axiosPostModule.axiosPost);
const mockAxiosPut = vi.mocked(axiosPutModule.axiosPut);
const mockAxiosDelete = vi.mocked(axiosDeleteModule.axiosDelete);

describe('AxiosRequest', () => {
    describe('structure', () => {
        it('should have all HTTP methods', () => {
            expect(AxiosRequest).toHaveProperty('get');
            expect(AxiosRequest).toHaveProperty('post');
            expect(AxiosRequest).toHaveProperty('put');
            expect(AxiosRequest).toHaveProperty('delete');
        });

        it('should map to correct method functions', () => {
            expect(AxiosRequest.get).toBe(axiosGetModule.axiosGet);
            expect(AxiosRequest.post).toBe(axiosPostModule.axiosPost);
            expect(AxiosRequest.put).toBe(axiosPutModule.axiosPut);
            expect(AxiosRequest.delete).toBe(axiosDeleteModule.axiosDelete);
        });
    });

    describe('method delegation', () => {
        const testUrl = 'https://api.example.com/test';
        const testToken = 'test-token';
        const testConfig = { timeout: 5000 };

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should delegate GET requests correctly', async () => {
            const mockResponse = { data: { success: true } };
            mockAxiosGet.mockResolvedValue(mockResponse as any);

            const result = await AxiosRequest.get(testUrl, testToken, testConfig);

            expect(mockAxiosGet).toHaveBeenCalledWith(testUrl, testToken, testConfig);
            expect(result).toBe(mockResponse);
        });

        it('should delegate POST requests correctly', async () => {
            const mockResponse = { data: { created: true } };
            mockAxiosPost.mockResolvedValue(mockResponse as any);

            const result = await AxiosRequest.post(testUrl, testToken);

            expect(mockAxiosPost).toHaveBeenCalledWith(testUrl, testToken);
            expect(result).toBe(mockResponse);
        });

        it('should delegate PUT requests correctly', async () => {
            const mockResponse = { data: { updated: true } };
            mockAxiosPut.mockResolvedValue(mockResponse as any);

            const result = await AxiosRequest.put(testUrl, testToken);

            expect(mockAxiosPut).toHaveBeenCalledWith(testUrl, testToken);
            expect(result).toBe(mockResponse);
        });

        it('should delegate DELETE requests correctly', async () => {
            const mockResponse = { data: { deleted: true } };
            mockAxiosDelete.mockResolvedValue(mockResponse as any);

            const result = await AxiosRequest.delete(testUrl, testToken);

            expect(mockAxiosDelete).toHaveBeenCalledWith(testUrl, testToken);
            expect(result).toBe(mockResponse);
        });
    });

    describe('error handling delegation', () => {
        const testUrl = 'https://api.example.com/test';
        const testToken = 'test-token';

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should propagate GET errors', async () => {
            const error = new Error('GET failed');
            mockAxiosGet.mockRejectedValue(error);

            await expect(AxiosRequest.get(testUrl, testToken)).rejects.toThrow('GET failed');
        });

        it('should propagate POST errors', async () => {
            const error = new Error('POST failed');
            mockAxiosPost.mockRejectedValue(error);

            await expect(AxiosRequest.post(testUrl, testToken)).rejects.toThrow('POST failed');
        });

        it('should propagate PUT errors', async () => {
            const error = new Error('PUT failed');
            mockAxiosPut.mockRejectedValue(error);

            await expect(AxiosRequest.put(testUrl, testToken)).rejects.toThrow('PUT failed');
        });

        it('should propagate DELETE errors', async () => {
            const error = new Error('DELETE failed');
            mockAxiosDelete.mockRejectedValue(error);

            await expect(AxiosRequest.delete(testUrl, testToken)).rejects.toThrow('DELETE failed');
        });
    });

    describe('type safety', () => {
        it('should support generic type parameters for GET', async () => {
      type TestResponse = {
        id: number;
        name: string;
      }

      const mockResponse = { data: { id: 1, name: 'test' } };
      mockAxiosGet.mockResolvedValue(mockResponse as any);

      const result = await AxiosRequest.get<TestResponse>('url', 'token');

      expect(result.data).toEqual({ id: 1, name: 'test' });
        });

        it('should support generic type parameters for POST', async () => {
      type CreateResponse = {
        id: number;
        created: boolean;
      }

      const mockResponse = { data: { id: 1, created: true } };
      mockAxiosPost.mockResolvedValue(mockResponse as any);

      const result = await AxiosRequest.post<CreateResponse>('url', 'token');

      expect(result.data).toEqual({ id: 1, created: true });
        });

        it('should support generic type parameters for PUT', async () => {
      type UpdateResponse = {
        id: number;
        updated: boolean;
      }

      const mockResponse = { data: { id: 1, updated: true } };
      mockAxiosPut.mockResolvedValue(mockResponse as any);

      const result = await AxiosRequest.put<UpdateResponse>('url', 'token');

      expect(result.data).toEqual({ id: 1, updated: true });
        });

        it('should support generic type parameters for DELETE', async () => {
      type DeleteResponse = {
        success: boolean;
        message: string;
      }

      const mockResponse = { data: { success: true, message: 'deleted' } };
      mockAxiosDelete.mockResolvedValue(mockResponse as any);

      const result = await AxiosRequest.delete<DeleteResponse>('url', 'token');

      expect(result.data).toEqual({ success: true, message: 'deleted' });
        });
    });

    describe('usage patterns', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should support chaining and method calls', async () => {
            const mockGetResponse = { data: { id: 1 } };
            const mockPutResponse = { data: { updated: true } };
      
            mockAxiosGet.mockResolvedValue(mockGetResponse as any);
            mockAxiosPut.mockResolvedValue(mockPutResponse as any);

            // Simulate common usage pattern
            const getResult = await AxiosRequest.get('url', 'token');
            const putResult = await AxiosRequest.put('url', 'token');

            expect(mockAxiosGet).toHaveBeenCalledTimes(1);
            expect(mockAxiosPut).toHaveBeenCalledTimes(1);
            expect(getResult).toBe(mockGetResponse);
            expect(putResult).toBe(mockPutResponse);
        });

        it('should handle concurrent requests', async () => {
            const mockResponses = [
                { data: { result: 'get' } },
                { data: { result: 'post' } },
                { data: { result: 'put' } },
                { data: { result: 'delete' } }
            ];

            mockAxiosGet.mockResolvedValue(mockResponses[0] as any);
            mockAxiosPost.mockResolvedValue(mockResponses[1] as any);
            mockAxiosPut.mockResolvedValue(mockResponses[2] as any);
            mockAxiosDelete.mockResolvedValue(mockResponses[3] as any);

            const promises = [
                AxiosRequest.get('url1', 'token'),
                AxiosRequest.post('url2', 'token'),
                AxiosRequest.put('url3', 'token'),
                AxiosRequest.delete('url4', 'token')
            ];

            const results = await Promise.all(promises);

            expect(results).toHaveLength(4);
            expect(results.map((r: any) => r.data.result)).toEqual(['get', 'post', 'put', 'delete']);
        });
    });

    describe('interface consistency', () => {
        it('should provide consistent interface across all methods', () => {
            // All methods should be functions
            expect(typeof AxiosRequest.get).toBe('function');
            expect(typeof AxiosRequest.post).toBe('function');
            expect(typeof AxiosRequest.put).toBe('function');
            expect(typeof AxiosRequest.delete).toBe('function');
        });

        it('should maintain object structure', () => {
            const methodNames = Object.keys(AxiosRequest);
            expect(methodNames).toContain('get');
            expect(methodNames).toContain('post');
            expect(methodNames).toContain('put');
            expect(methodNames).toContain('delete');
            expect(methodNames).toHaveLength(4);
        });

        it('should be extensible', () => {
            // The object should be extensible for future HTTP methods
            const extended = { ...AxiosRequest, patch: vi.fn() };
            expect(extended).toHaveProperty('patch');
            expect(extended).toHaveProperty('get');
        });
    });

    describe('module exports', () => {
        it('should be the default export of the module', () => {
            // This test ensures the AxiosRequest object is properly exported
            expect(AxiosRequest).toBeDefined();
            expect(typeof AxiosRequest).toBe('object');
        });

        it('should not expose internal implementation details', () => {
            // The AxiosRequest object should only expose the public interface
            const keys = Object.keys(AxiosRequest);
            const privateKeys = keys.filter(key => key.startsWith('_') || key.includes('internal'));
            expect(privateKeys).toHaveLength(0);
        });
    });
});