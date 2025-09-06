/**
 * @file Settings API - Create Tests
 * @description Tests for POST /api/settings endpoint
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../../pages/api/settings';
import { 
    createMockRequestResponse, 
    expectResponse, 
    mockPlexResponses 
} from './api-test-helpers';

// Mock the external dependencies
const mockPlex = {
    createSettings: vi.fn(),
    validateConnection: vi.fn(),
    getSettings: vi.fn()
};

vi.mock('../../src/library/plex', () => ({
    ...mockPlex,
}));

describe('/api/settings - POST (Create)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default mock implementations
        mockPlex.createSettings.mockResolvedValue(mockPlexResponses.settings);
        mockPlex.validateConnection.mockResolvedValue(true);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('Valid Settings Creation', () => {
        it('should create new settings successfully', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {
                    token: 'new-plex-token',
                    uri: 'http://192.168.1.100:32400',
                    id: 'new-server-id'
                }
            });

            await handler(req, res);

            expectResponse(res, 201, {
                success: true,
                data: mockPlexResponses.settings
            });

            expect(mockPlex.createSettings).toHaveBeenCalledWith({
                token: 'new-plex-token',
                uri: 'http://192.168.1.100:32400',
                id: 'new-server-id'
            });
        });

        it('should validate connection before creating settings', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {
                    token: 'test-token',
                    uri: 'http://test-server:32400',
                    id: 'test-id'
                }
            });

            await handler(req, res);

            expect(mockPlex.validateConnection).toHaveBeenCalledWith({
                token: 'test-token',
                uri: 'http://test-server:32400',
                id: 'test-id'
            });

            expectResponse(res, 201);
        });
    });

    describe('Validation Errors', () => {
        it('should reject empty request body', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {}
            });

            await handler(req, res);

            expectResponse(res, 400, {
                error: 'Missing required fields: token, uri, id'
            });
        });

        it('should reject missing token', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {
                    uri: 'http://192.168.1.100:32400',
                    id: 'test-id'
                }
            });

            await handler(req, res);

            expectResponse(res, 400, {
                error: 'Missing required fields: token'
            });
        });

        it('should reject invalid URI format', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {
                    token: 'test-token',
                    uri: 'invalid-uri-format',
                    id: 'test-id'
                }
            });

            await handler(req, res);

            expectResponse(res, 400, {
                error: 'Invalid URI format'
            });
        });
    });

    describe('Connection Validation Failures', () => {
        it('should reject settings when connection validation fails', async () => {
            mockPlex.validateConnection.mockResolvedValue(false);
            
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {
                    token: 'invalid-token',
                    uri: 'http://192.168.1.100:32400',
                    id: 'test-id'
                }
            });

            await handler(req, res);

            expectResponse(res, 400, {
                error: 'Failed to validate Plex connection'
            });
        });

        it('should handle connection validation timeout', async () => {
            mockPlex.validateConnection.mockRejectedValue(new Error('Connection timeout'));
            
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {
                    token: 'test-token',
                    uri: 'http://slow-server:32400',
                    id: 'test-id'
                }
            });

            await handler(req, res);

            expectResponse(res, 500, {
                error: 'Connection validation failed'
            });
        });
    });

    describe('Database Errors', () => {
        it('should handle database creation errors', async () => {
            mockPlex.createSettings.mockRejectedValue(new Error('Database connection failed'));
            
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {
                    token: 'test-token',
                    uri: 'http://192.168.1.100:32400',
                    id: 'test-id'
                }
            });

            await handler(req, res);

            expectResponse(res, 500, {
                error: 'Failed to create settings'
            });
        });

        it('should handle duplicate settings creation', async () => {
            mockPlex.createSettings.mockRejectedValue(new Error('Settings already exist'));
            
            const { req, res } = createMockRequestResponse({
                method: 'POST',
                body: {
                    token: 'test-token',
                    uri: 'http://192.168.1.100:32400',
                    id: 'existing-id'
                }
            });

            await handler(req, res);

            expectResponse(res, 409, {
                error: 'Settings already exist for this server'
            });
        });
    });
});