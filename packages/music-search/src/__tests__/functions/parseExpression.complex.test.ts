import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseExpression } from '../../functions/parseExpression';
import { TrackWithMatching } from '../../types/TrackWithMatching';

// Mock console.warn to test error handling
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { /* empty */ });

describe('parseExpression - Complex Boolean Expressions', () => {
    beforeEach(() => {
        mockConsoleWarn.mockClear();
    });

    // Helper function to create a mock track with specified matching properties
    const createMockTrack = (matching: Partial<TrackWithMatching['matching']> = {}): TrackWithMatching => ({
        id: 'test-track-id',
        title: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
        matching: {
            album: { match: false, contains: false, similarity: 0, ...matching.album },
            title: { match: false, contains: false, similarity: 0, ...matching.title },
            artist: { match: false, contains: false, similarity: 0, ...matching.artist },
            artistInTitle: { match: false, contains: false, similarity: 0, ...matching.artistInTitle },
            artistWithTitle: { match: false, contains: false, similarity: 0, ...matching.artistWithTitle },
        }
    });

    describe('AND operations', () => {
        it('should handle simple AND expressions', () => {
            const filter = parseExpression('artist:match AND title:match');
            
            const bothMatchTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: true, contains: false, similarity: 0.9 }
            });
            const artistOnlyTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: false, contains: false, similarity: 0.5 }
            });
            const titleOnlyTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.9 }
            });
            const neitherTrack = createMockTrack();

            expect(filter(bothMatchTrack)).toBe(true);
            expect(filter(artistOnlyTrack)).toBe(false);
            expect(filter(titleOnlyTrack)).toBe(false);
            expect(filter(neitherTrack)).toBe(false);
        });

        it('should handle multiple AND operations', () => {
            const filter = parseExpression('artist:match AND title:contains AND album:match');
            
            const allMatchTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: false, contains: true, similarity: 0.7 },
                album: { match: true, contains: false, similarity: 0.9 }
            });
            const partialMatchTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: false, contains: true, similarity: 0.7 },
                album: { match: false, contains: false, similarity: 0.5 }
            });

            expect(filter(allMatchTrack)).toBe(true);
            expect(filter(partialMatchTrack)).toBe(false);
        });

        it('should handle mixed operations with AND', () => {
            const filter = parseExpression('artist:similarity>=0.8 AND title:contains');
            
            const matchingTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.85 },
                title: { match: false, contains: true, similarity: 0.6 }
            });
            const lowSimilarityTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.7 },
                title: { match: false, contains: true, similarity: 0.6 }
            });

            expect(filter(matchingTrack)).toBe(true);
            expect(filter(lowSimilarityTrack)).toBe(false);
        });
    });

    describe('OR operations', () => {
        it('should handle simple OR expressions', () => {
            const filter = parseExpression('artist:match OR title:match');
            
            const bothMatchTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: true, contains: false, similarity: 0.9 }
            });
            const artistOnlyTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: false, contains: false, similarity: 0.5 }
            });
            const titleOnlyTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.9 }
            });
            const neitherTrack = createMockTrack();

            expect(filter(bothMatchTrack)).toBe(true);
            expect(filter(artistOnlyTrack)).toBe(true);
            expect(filter(titleOnlyTrack)).toBe(true);
            expect(filter(neitherTrack)).toBe(false);
        });

        it('should handle multiple OR operations', () => {
            const filter = parseExpression('artist:match OR title:contains OR album:similarity>=0.9');
            
            const artistMatchTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 },
                title: { match: false, contains: false, similarity: 0.3 },
                album: { match: false, contains: false, similarity: 0.2 }
            });
            const albumSimilarityTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: false, contains: false, similarity: 0.3 },
                album: { match: false, contains: false, similarity: 0.95 }
            });
            const noMatchTrack = createMockTrack();

            expect(filter(artistMatchTrack)).toBe(true);
            expect(filter(albumSimilarityTrack)).toBe(true);
            expect(filter(noMatchTrack)).toBe(false);
        });
    });

    describe('mixed AND/OR operations', () => {
        it('should handle combined AND/OR expressions (left-to-right evaluation)', () => {
            // Expression: artist:match AND title:contains OR album:match
            // Should be evaluated as: (artist:match AND title:contains) OR album:match
            const filter = parseExpression('artist:match AND title:contains OR album:match');
            
            const artistAndTitleTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: false, contains: true, similarity: 0.7 },
                album: { match: false, contains: false, similarity: 0.3 }
            });
            const albumOnlyTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: false, contains: false, similarity: 0.4 },
                album: { match: true, contains: false, similarity: 0.9 }
            });
            const artistOnlyTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: false, contains: false, similarity: 0.4 },
                album: { match: false, contains: false, similarity: 0.3 }
            });

            expect(filter(artistAndTitleTrack)).toBe(true);
            expect(filter(albumOnlyTrack)).toBe(true);
            expect(filter(artistOnlyTrack)).toBe(false);
        });

        it('should handle complex mixed expressions', () => {
            // Left-to-right: (artist:similarity>=0.8 OR title:match) AND album:contains
            const filter = parseExpression('artist:similarity>=0.8 OR title:match AND album:contains');
            
            const highArtistSimilarityTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.9 },
                title: { match: false, contains: false, similarity: 0.3 },
                album: { match: false, contains: true, similarity: 0.2 }
            });
            const titleAndAlbumTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.8 },
                album: { match: false, contains: true, similarity: 0.6 }
            });
            const artistOnlyTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.9 },
                title: { match: false, contains: false, similarity: 0.3 },
                album: { match: false, contains: false, similarity: 0.2 }
            });

            expect(filter(highArtistSimilarityTrack)).toBe(true);
            expect(filter(titleAndAlbumTrack)).toBe(true);
            expect(filter(artistOnlyTrack)).toBe(false); // High artist but no album contains
        });
    });
});