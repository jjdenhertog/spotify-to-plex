/**
 * @file API Test Helper Utilities
 * @description Helper functions for testing API routes
 */

import { expect } from 'vitest';
import { createMocks, RequestMethod } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';

// Extend NextApiResponse to include node-mocks-http methods
type MockNextApiResponse = {
    _getStatusCode: () => number;
    _getJSONData: () => any;
} & NextApiResponse

export function createMockRequestResponse(options: {
    method?: RequestMethod;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: any;
} = {}) {
    const { req, res } = createMocks<NextApiRequest, MockNextApiResponse>({
        method: options.method || 'GET',
        headers: options.headers,
        query: options.query,
        body: options.body,
    });

    return { req, res };
}

export function expectResponse(res: MockNextApiResponse, expectedStatus: number, expectedData?: any) {
    expect(res._getStatusCode()).toBe(expectedStatus);
    
    if (expectedData !== undefined) {
        const responseData = res._getJSONData();
        expect(responseData).toEqual(expectedData);
    }
}