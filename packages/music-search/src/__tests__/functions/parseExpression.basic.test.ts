import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseExpression } from '../../functions/parseExpression';
import { TrackWithMatching } from '../../types/TrackWithMatching';

// Mock console.warn to test error handling
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { /* empty */ });

describe('parseExpression - Basic Functionality', () => {
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

    describe('basic functionality', () => {
        it('should return a function when given a valid expression', () => {
            const filter = parseExpression('artist:match');
            expect(typeof filter).toBe('function');
        });

        it('should return a function that always returns false for invalid expressions', () => {
            const filter = parseExpression('invalid-expression');
            const track = createMockTrack();
            
            expect(filter(track)).toBe(false);
            expect(mockConsoleWarn).toHaveBeenCalled();
        });

        it('should handle empty expressions gracefully', () => {
            const filter = parseExpression('');
            const track = createMockTrack();
            
            expect(filter(track)).toBe(false);
            // Empty expressions return a function that returns false but don't warn
        });
    });

    describe('simple field expressions', () => {
        describe('match operation', () => {
            it('should filter by artist match', () => {
                const filter = parseExpression('artist:match');
                
                const matchingTrack = createMockTrack({
                    artist: { match: true, contains: false, similarity: 0.9 }
                });
                const nonMatchingTrack = createMockTrack({
                    artist: { match: false, contains: true, similarity: 0.9 }
                });

                expect(filter(matchingTrack)).toBe(true);
                expect(filter(nonMatchingTrack)).toBe(false);
            });

            it('should filter by title match', () => {
                const filter = parseExpression('title:match');
                
                const matchingTrack = createMockTrack({
                    title: { match: true, contains: false, similarity: 0.5 }
                });
                const nonMatchingTrack = createMockTrack({
                    title: { match: false, contains: true, similarity: 0.9 }
                });

                expect(filter(matchingTrack)).toBe(true);
                expect(filter(nonMatchingTrack)).toBe(false);
            });

            it('should filter by album match', () => {
                const filter = parseExpression('album:match');
                
                const matchingTrack = createMockTrack({
                    album: { match: true, contains: false, similarity: 0.3 }
                });
                const nonMatchingTrack = createMockTrack({
                    album: { match: false, contains: false, similarity: 0.9 }
                });

                expect(filter(matchingTrack)).toBe(true);
                expect(filter(nonMatchingTrack)).toBe(false);
            });

            it('should filter by artistWithTitle match', () => {
                const filter = parseExpression('artistWithTitle:match');
                
                const matchingTrack = createMockTrack({
                    artistWithTitle: { match: true, contains: false, similarity: 0.8 }
                });
                const nonMatchingTrack = createMockTrack({
                    artistWithTitle: { match: false, contains: true, similarity: 0.8 }
                });

                expect(filter(matchingTrack)).toBe(true);
                expect(filter(nonMatchingTrack)).toBe(false);
            });

            it('should filter by artistInTitle match', () => {
                const filter = parseExpression('artistInTitle:match');
                
                const matchingTrack = createMockTrack({
                    artistInTitle: { match: true, contains: false, similarity: 0.7 }
                });
                const nonMatchingTrack = createMockTrack({
                    artistInTitle: { match: false, contains: false, similarity: 0.7 }
                });

                expect(filter(matchingTrack)).toBe(true);
                expect(filter(nonMatchingTrack)).toBe(false);
            });
        });

        describe('contains operation', () => {
            it('should filter by artist contains', () => {
                const filter = parseExpression('artist:contains');
                
                const matchingTrack = createMockTrack({
                    artist: { match: false, contains: true, similarity: 0.5 }
                });
                const nonMatchingTrack = createMockTrack({
                    artist: { match: true, contains: false, similarity: 0.9 }
                });

                expect(filter(matchingTrack)).toBe(true);
                expect(filter(nonMatchingTrack)).toBe(false);
            });

            it('should filter by title contains', () => {
                const filter = parseExpression('title:contains');
                
                const matchingTrack = createMockTrack({
                    title: { match: false, contains: true, similarity: 0.6 }
                });
                const nonMatchingTrack = createMockTrack({
                    title: { match: false, contains: false, similarity: 0.8 }
                });

                expect(filter(matchingTrack)).toBe(true);
                expect(filter(nonMatchingTrack)).toBe(false);
            });
        });

        describe('is operation (exact match)', () => {
            it('should filter by exact match (both match and contains)', () => {
                const filter = parseExpression('artist:is');
                
                const exactMatchTrack = createMockTrack({
                    artist: { match: true, contains: true, similarity: 1 }
                });
                const partialMatchTrack = createMockTrack({
                    artist: { match: true, contains: false, similarity: 0.9 }
                });
                const containsOnlyTrack = createMockTrack({
                    artist: { match: false, contains: true, similarity: 0.7 }
                });
                const noMatchTrack = createMockTrack({
                    artist: { match: false, contains: false, similarity: 0.5 }
                });

                expect(filter(exactMatchTrack)).toBe(true);
                expect(filter(partialMatchTrack)).toBe(false);
                expect(filter(containsOnlyTrack)).toBe(false);
                expect(filter(noMatchTrack)).toBe(false);
            });
        });

        describe('not operation (negation)', () => {
            it('should filter by negated match', () => {
                const filter = parseExpression('artist:not');
                
                const matchingTrack = createMockTrack({
                    artist: { match: true, contains: true, similarity: 0.9 }
                });
                const nonMatchingTrack = createMockTrack({
                    artist: { match: false, contains: false, similarity: 0.3 }
                });

                expect(filter(matchingTrack)).toBe(false);
                expect(filter(nonMatchingTrack)).toBe(true);
            });
        });

        describe('similarity operations', () => {
            it('should filter by similarity threshold', () => {
                const filter = parseExpression('artist:similarity>=0.8');
                
                const highSimilarityTrack = createMockTrack({
                    artist: { match: false, contains: false, similarity: 0.85 }
                });
                const exactThresholdTrack = createMockTrack({
                    artist: { match: false, contains: false, similarity: 0.8 }
                });
                const lowSimilarityTrack = createMockTrack({
                    artist: { match: false, contains: false, similarity: 0.75 }
                });

                expect(filter(highSimilarityTrack)).toBe(true);
                expect(filter(exactThresholdTrack)).toBe(true);
                expect(filter(lowSimilarityTrack)).toBe(false);
            });

            it('should handle different similarity thresholds', () => {
                const lowThresholdFilter = parseExpression('title:similarity>=0.3');
                const highThresholdFilter = parseExpression('title:similarity>=0.9');
                
                const mediumSimilarityTrack = createMockTrack({
                    title: { match: false, contains: false, similarity: 0.6 }
                });

                expect(lowThresholdFilter(mediumSimilarityTrack)).toBe(true);
                expect(highThresholdFilter(mediumSimilarityTrack)).toBe(false);
            });

            it('should handle missing similarity values', () => {
                const filter = parseExpression('artist:similarity>=0.5');
                
                // Create a track without similarity data (defaults to 0)
                const track = createMockTrack({
                    artist: { match: false, contains: false, similarity: 0 }
                });

                expect(filter(track)).toBe(false);
            });
        });
    });

    describe('invalid expressions and error handling', () => {
        it('should handle invalid field names', () => {
            const filter = parseExpression('invalidField:match');
            const track = createMockTrack();
            
            expect(filter(track)).toBe(false);
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Failed to parse expression: invalidField:match'),
                expect.stringContaining('Invalid field: invalidField')
            );
        });

        it('should handle invalid operations', () => {
            const filter = parseExpression('artist:invalidOperation');
            const track = createMockTrack();
            
            expect(filter(track)).toBe(false);
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Failed to parse expression: artist:invalidOperation'),
                expect.stringContaining('Invalid operation: invalidOperation')
            );
        });

        it('should handle invalid similarity thresholds', () => {
            const invalidFilters = [
                'artist:similarity>=invalid',
                'artist:similarity>=-0.5',
                'artist:similarity>=1.5',
                'artist:similarity>=abc'
            ];

            invalidFilters.forEach(expression => {
                mockConsoleWarn.mockClear();
                const filter = parseExpression(expression);
                const track = createMockTrack();
                
                expect(filter(track)).toBe(false);
                expect(mockConsoleWarn).toHaveBeenCalled();
            });
        });

        it('should handle malformed condition format', () => {
            const invalidExpressions = [
                'artist',
                'artist:',
                ':match',
                'artist:match:extra',
                'artist match'
            ];

            invalidExpressions.forEach(expression => {
                mockConsoleWarn.mockClear();
                const filter = parseExpression(expression);
                const track = createMockTrack();
                
                expect(filter(track)).toBe(false);
                expect(mockConsoleWarn).toHaveBeenCalled();
            });
        });

        it('should handle invalid operators', () => {
            const filter = parseExpression('artist:match INVALID title:match');
            const track = createMockTrack();
            
            expect(filter(track)).toBe(false);
            expect(mockConsoleWarn).toHaveBeenCalled();
        });

        it('should handle expressions with only operators', () => {
            const filter = parseExpression('AND OR AND');
            const track = createMockTrack();
            
            expect(filter(track)).toBe(false);
            expect(mockConsoleWarn).toHaveBeenCalled();
        });
    });

    describe('edge cases and malformed input', () => {
        it('should handle expressions with extra whitespace', () => {
            const filter = parseExpression('  artist:match   AND   title:contains  ');
            
            const matchingTrack = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.8 },
                title: { match: false, contains: true, similarity: 0.7 }
            });

            expect(filter(matchingTrack)).toBe(true);
        });

        it('should handle case sensitivity in operators', () => {
            // Operators should be case sensitive (only AND/OR, not and/or)
            const filter = parseExpression('artist:match and title:match');
            const track = createMockTrack();
            
            expect(filter(track)).toBe(false);
            expect(mockConsoleWarn).toHaveBeenCalled();
        });

        it('should handle expressions with missing fields', () => {
            const track = createMockTrack({
                // Missing some matching fields - should default to all false
            });
            
            const filter = parseExpression('artist:match');
            expect(filter(track)).toBe(false);
        });

        it('should handle boundary similarity values', () => {
            const exactZeroFilter = parseExpression('artist:similarity>=0');
            const exactOneFilter = parseExpression('artist:similarity>=1');
            
            const zeroSimilarityTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0 }
            });
            const perfectSimilarityTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 1 }
            });

            expect(exactZeroFilter(zeroSimilarityTrack)).toBe(true);
            expect(exactZeroFilter(perfectSimilarityTrack)).toBe(true);
            expect(exactOneFilter(zeroSimilarityTrack)).toBe(false);
            expect(exactOneFilter(perfectSimilarityTrack)).toBe(true);
        });

        it('should handle expressions with no valid conditions', () => {
            const filter = parseExpression('   ');
            const track = createMockTrack();
            
            expect(filter(track)).toBe(false);
            expect(mockConsoleWarn).toHaveBeenCalled();
        });

        it('should handle extremely long expressions', () => {
            const longExpression = Array.from({ length: 50 }, (_, i) => 
                `artist:similarity>=0.${i.toString().padStart(2, '0')}`
            ).join(' OR ');
            
            const filter = parseExpression(longExpression);
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.25 }
            });
            
            expect(typeof filter).toBe('function');
            expect(filter(track)).toBe(true); // Should match similarity>=0.25
        });

        it('should handle decimal precision in similarity thresholds', () => {
            const filter = parseExpression('artist:similarity>=0.123456789');
            
            const justAboveTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.123_456_79 }
            });
            const justBelowTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.123_456_78 }
            });

            expect(filter(justAboveTrack)).toBe(true);
            expect(filter(justBelowTrack)).toBe(false);
        });
    });

    describe('real-world scenarios', () => {
        it('should handle typical music search patterns', () => {
            const patterns = [
                'artist:match AND title:similarity>=0.8',
                'artist:contains OR artistWithTitle:match',
                'title:is AND album:contains',
                'artist:not AND title:match',
                'artistInTitle:similarity>=0.7 OR artist:match AND title:similarity>=0.9'
            ];

            patterns.forEach(pattern => {
                const filter = parseExpression(pattern);
                expect(typeof filter).toBe('function');
            });
        });

        it('should handle high-precision matching requirements', () => {
            const filter = parseExpression('artist:similarity>=0.95 AND title:similarity>=0.95 AND album:similarity>=0.8');
            
            const highQualityTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.96 },
                title: { match: false, contains: false, similarity: 0.97 },
                album: { match: false, contains: false, similarity: 0.85 }
            });
            const mediumQualityTrack = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.94 },
                title: { match: false, contains: false, similarity: 0.97 },
                album: { match: false, contains: false, similarity: 0.85 }
            });

            expect(filter(highQualityTrack)).toBe(true);
            expect(filter(mediumQualityTrack)).toBe(false);
        });
    });

    describe('performance', () => {
        it('should handle many evaluations efficiently', () => {
            const filter = parseExpression('artist:similarity>=0.8 OR title:match AND album:contains');
            const tracks = Array.from({ length: 1000 }, () => 
                createMockTrack({
                    artist: { match: false, contains: false, similarity: Math.random() },
                    title: { match: Math.random() > 0.5, contains: false, similarity: Math.random() },
                    album: { match: false, contains: Math.random() > 0.5, similarity: Math.random() }
                })
            );

            const start = performance.now();
            const results = tracks.map(track => filter(track));
            const end = performance.now();

            expect(results).toHaveLength(1000);
            expect(end - start).toBeLessThan(100); // Should complete in under 100ms
        });
    });
});