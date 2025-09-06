/**
 * @file API Routes Test Suite Entry Point
 * @description Simple test to verify API test utilities work
 */

import { describe, it, expect } from 'vitest';
import { createMockRequestResponse, expectResponse } from './api-test-helpers';

describe('API Test Utilities', () => {
    it('should create mock request and response objects', () => {
        const { req, res } = createMockRequestResponse({ 
            method: 'GET',
            headers: { 'content-type': 'application/json' }
        });

        expect(req).toBeDefined();
        expect(req.method).toBe('GET');
        expect(res).toBeDefined();
        expect(typeof res._getStatusCode).toBe('function');
    });

    it('should verify response helper works', () => {
        const { req, res } = createMockRequestResponse({ method: 'GET' });
        
        // Simulate setting a status and response
        res.status(200).json({ message: 'OK' });
        
        expectResponse(res, 200, { message: 'OK' });
    });
});