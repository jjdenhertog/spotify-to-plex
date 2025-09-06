/**
 * @file Spotify Data API - Playlists Tests
 * @description Tests for Spotify playlist data endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../../src/pages/api/spotify/data';
import { 
    createMockRequestResponse, 
    expectResponse, 
    mockSpotifyResponses 
} from './api-test-helpers';

// Mock the external dependencies
const mockSpotify = {
    getUserPlaylists: vi.fn(),
    getPlaylistTracks: vi.fn(),
    getPlaylist: vi.fn()
};

vi.mock('../../src/library/spotify', () => ({
    ...mockSpotify,
}));

describe('/api/spotify/data - Playlists', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default mock implementations
        mockSpotify.getUserPlaylists.mockResolvedValue(mockSpotifyResponses.playlists);
        mockSpotify.getPlaylistTracks.mockResolvedValue(mockSpotifyResponses.tracks);
        mockSpotify.getPlaylist.mockResolvedValue(mockSpotifyResponses.playlists.items[0]);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('Get User Playlists', () => {
        it('should retrieve user playlists successfully', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'GET',
                query: { type: 'playlists' }
            });

            await handler(req, res);

            expectResponse(res, 200, {
                data: mockSpotifyResponses.playlists
            });

            expect(mockSpotify.getUserPlaylists).toHaveBeenCalled();
        });

        it('should handle pagination for playlists', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'GET',
                query: { 
                    type: 'playlists',
                    offset: '20',
                    limit: '50'
                }
            });

            await handler(req, res);

            expect(mockSpotify.getUserPlaylists).toHaveBeenCalledWith(
                expect.objectContaining({
                    offset: 20,
                    limit: 50
                })
            );
        });
    });

    describe('Get Playlist Tracks', () => {
        it('should retrieve tracks for specific playlist', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'GET',
                query: { 
                    type: 'playlist-tracks',
                    playlistId: 'playlist-1'
                }
            });

            await handler(req, res);

            expectResponse(res, 200, {
                data: mockSpotifyResponses.tracks
            });

            expect(mockSpotify.getPlaylistTracks).toHaveBeenCalledWith('playlist-1');
        });

        it('should handle missing playlist ID', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'GET',
                query: { type: 'playlist-tracks' }
            });

            await handler(req, res);

            expectResponse(res, 400, {
                error: 'Playlist ID is required'
            });
        });
    });

    describe('Get Single Playlist', () => {
        it('should retrieve single playlist details', async () => {
            const { req, res } = createMockRequestResponse({
                method: 'GET',
                query: { 
                    type: 'playlist',
                    playlistId: 'playlist-1'
                }
            });

            await handler(req, res);

            expectResponse(res, 200, {
                data: mockSpotifyResponses.playlists.items[0]
            });

            expect(mockSpotify.getPlaylist).toHaveBeenCalledWith('playlist-1');
        });
    });

    describe('Error Handling', () => {
        it('should handle Spotify API errors', async () => {
            mockSpotify.getUserPlaylists.mockRejectedValue(new Error('Spotify API Error'));
            
            const { req, res } = createMockRequestResponse({
                method: 'GET',
                query: { type: 'playlists' }
            });

            await handler(req, res);

            expectResponse(res, 500, {
                error: 'Failed to fetch playlists'
            });
        });

        it('should handle unauthorized access', async () => {
            mockSpotify.getUserPlaylists.mockRejectedValue(new Error('Unauthorized'));
            
            const { req, res } = createMockRequestResponse({
                method: 'GET',
                query: { type: 'playlists' }
            });

            await handler(req, res);

            expectResponse(res, 401, {
                error: 'Unauthorized access to Spotify'
            });
        });
    });
});