/**
 * @file API Test Helper Utilities
 * @description Helper functions for testing API routes
 */

import { expect } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';

export function createMockRequestResponse(options: {
    method?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: any;
} = {}) {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: options.method || 'GET',
        headers: options.headers,
        query: options.query,
        body: options.body,
    });

    return { req, res };
}

export function expectResponse(res: NextApiResponse, expectedStatus: number, expectedData?: any) {
    expect(res._getStatusCode()).toBe(expectedStatus);
    
    if (expectedData !== undefined) {
        const responseData = res._getJSONData();
        expect(responseData).toEqual(expectedData);
    }
}