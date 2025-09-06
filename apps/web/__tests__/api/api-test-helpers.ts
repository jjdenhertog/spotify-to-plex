import { createMocks, RequestMethod } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { beforeAll, afterAll, expect } from 'vitest';

// Helper to create mock request and response objects
export function createMockRequestResponse(options: {
  method?: string;
  body?: any;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
}) {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: (options.method || 'GET') as RequestMethod,
        body: options.body || {},
        query: options.query || {},
        headers: options.headers || {},
    });

    return { req, res };
}

// Mock environment variables helper
export function mockEnvVars(envVars: Record<string, string>) {
    const originalEnv = process.env;
  
    beforeAll(() => {
        process.env = { ...originalEnv, ...envVars };
    });

    afterAll(() => {
        process.env = originalEnv;
    });
}

// Helper to check response status and data
export function expectResponse(res: any, expectedStatus: number, expectedData?: any) {
    expect(res._getStatusCode()).toBe(expectedStatus);
  
    if (expectedData !== undefined) {
        const responseData = JSON.parse(res._getData());
        expect(responseData).toEqual(expectedData);
    }
}

// Mock external API response helper
export function createMockAxiosResponse(data: any, status: number = 200, statusText: string = 'OK') {
    return {
        data,
        status,
        statusText,
        headers: {},
        config: {},
    };
}

// Mock error response helper
export function createMockAxiosError(message: string, status: number = 500) {
    const error = new Error(message) as any;
    error.response = {
        status,
        data: { error: message },
        statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
    };

    return error;
}

// Plex API mock responses
export const mockPlexResponses = {
    // Mock Plex resources response
    resources: [
        {
            product: "Plex Media Server",
            name: "Test Server",
            clientIdentifier: "test-server-id",
            connections: [
                { uri: "http://192.168.1.100:32400", local: true },
                { uri: "https://test.plex.direct:443", local: false }
            ]
        }
    ],
  
    // Mock Plex settings
    settings: {
        token: "test-plex-token",
        uri: "http://192.168.1.100:32400",
        id: "test-server-id"
    },

    // Mock Plex tracks/libraries
    tracks: [
        {
            id: 1,
            title: "Test Song",
            artist: "Test Artist",
            album: "Test Album",
            duration: 180_000
        }
    ]
};

// Spotify API mock responses  
export const mockSpotifyResponses = {
    // Mock OAuth token response
    token: {
        access_token: "test-spotify-token",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "test-refresh-token"
    },

    // Mock user profile
    user: {
        id: "test-user",
        display_name: "Test User",
        email: "test@example.com"
    },

    // Mock playlists
    playlists: {
        items: [
            {
                id: "playlist-1",
                name: "Test Playlist",
                tracks: {
                    total: 10,
                    href: "https://api.spotify.com/v1/playlists/playlist-1/tracks"
                }
            }
        ]
    },

    // Mock tracks
    tracks: [
        {
            id: "track-1", 
            name: "Test Track",
            artists: [{ name: "Test Artist" }],
            album: { name: "Test Album" },
            duration_ms: 180_000
        }
    ]
};