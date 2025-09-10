import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compareTitles } from '../../utils/compareTitles';
import * as createSearchStringModule from '../../utils/createSearchString';

// Mock the createSearchString function to test logic isolation
vi.mock('../../utils/createSearchString', () => ({
    createSearchString: vi.fn((str) => str.toLowerCase())
}));

const mockCreateSearchString = vi.mocked(createSearchStringModule.createSearchString);

describe('compareTitles', () => {
    beforeEach(() => {
        mockCreateSearchString.mockClear();
        mockCreateSearchString.mockImplementation((str) => str.toLowerCase());
    });

    describe('basic functionality', () => {
        it('should return default result for undefined inputs', () => {
            const result = compareTitles();
            expect(result).toEqual({ match: false, contains: false, similarity: 0 });
        });

        it('should return default result when first parameter is undefined', () => {
            const result = compareTitles(undefined, 'hello');
            expect(result).toEqual({ match: false, contains: false, similarity: 0 });
        });

        it('should return default result when second parameter is undefined', () => {
            const result = compareTitles('hello');
            expect(result).toEqual({ match: false, contains: false, similarity: 0 });
        });

        it('should return default result for empty strings', () => {
            const result = compareTitles('', '');
            expect(result).toEqual({ match: false, contains: false, similarity: 0 });
        });
    });

    describe('exact matching', () => {
        it('should detect exact matches (case insensitive)', () => {
            const result = compareTitles('Hello World', 'hello world');
            expect(result.match).toBe(true);
            expect(result.similarity).toBeGreaterThan(0.9); // string-similarity should return high score
        });

        it('should detect exact matches with different cases', () => {
            const result = compareTitles('HELLO', 'hello');
            expect(result.match).toBe(true);
        });

        it('should not match different strings', () => {
            const result = compareTitles('Hello', 'Goodbye');
            expect(result.match).toBe(false);
        });

        it('should handle punctuation in matching', () => {
            // The function uses ignorePunctuation: false, so punctuation matters
            const result = compareTitles('Hello!', 'Hello');
            expect(result.match).toBe(false);
        });
    });

    describe('contains functionality', () => {
        describe('one-way contains (default)', () => {
            it('should detect when second string contains in first (normalized)', () => {
                const result = compareTitles('Hello World Test', 'world');
                expect(result.contains).toBe(true);
            });

            it('should not detect when first string contains in second', () => {
                const result = compareTitles('world', 'Hello World Test');
                expect(result.contains).toBe(false);
            });

            it('should handle case insensitive contains', () => {
                const result = compareTitles('Hello World', 'WORLD');
                expect(result.contains).toBe(true);
            });
        });

        describe('two-way contains', () => {
            it('should detect contains in both directions when twoWayContain is true', () => {
                const result1 = compareTitles('Hello World', 'World', true);
                expect(result1.contains).toBe(true);

                const result2 = compareTitles('World', 'Hello World', true);
                expect(result2.contains).toBe(true);
            });

            it('should work with two-way contains for equal strings', () => {
                const result = compareTitles('Hello', 'Hello', true);
                expect(result.contains).toBe(true);
            });
        });

        describe('short title exclusion', () => {
            it('should not use contains for titles shorter than 5 characters', () => {
                const result = compareTitles('Test', 'est');
                expect(result.contains).toBe(false);
            });

            it('should not use contains when second title is shorter than 5 characters', () => {
                const result = compareTitles('Testing Long Title', 'Test');
                expect(result.contains).toBe(false);
            });

            it('should use contains when both titles are 5+ characters', () => {
                const result = compareTitles('Testing', 'sting');
                expect(result.contains).toBe(true);
            });

            it('should handle exactly 5 character strings', () => {
                const result = compareTitles('Hello', 'ello');
                expect(result.contains).toBe(true);
            });
        });
    });

    describe('similarity scoring', () => {
        it('should return similarity score between 0 and 1', () => {
            const result = compareTitles('Hello', 'Hallo');
            expect(result.similarity).toBeGreaterThanOrEqual(0);
            expect(result.similarity).toBeLessThanOrEqual(1);
        });

        it('should return higher similarity for similar strings', () => {
            const similar = compareTitles('Hello World', 'Hello Wold');
            const dissimilar = compareTitles('Hello World', 'Goodbye');
      
            expect(similar.similarity).toBeGreaterThan(dissimilar.similarity);
        });

        it('should return perfect similarity for identical strings', () => {
            const result = compareTitles('Test String', 'Test String');
            expect(result.similarity).toBe(1);
        });
    });

    describe('createSearchString integration', () => {
        it('should call createSearchString for contains logic', () => {
            compareTitles('Hello World', 'world');
      
            expect(mockCreateSearchString).toHaveBeenCalledWith('Hello World');
            expect(mockCreateSearchString).toHaveBeenCalledWith('world');
        });

        it('should call createSearchString twice for two-way contains', () => {
            mockCreateSearchString.mockClear();
            compareTitles('Hello', 'World', true);
      
            expect(mockCreateSearchString).toHaveBeenCalledTimes(4); // 2 calls for each direction
        });

        it('should not call createSearchString for short titles', () => {
            mockCreateSearchString.mockClear();
            compareTitles('Hi', 'Bye');
      
            // Should not be called because both strings are < 5 characters
            expect(mockCreateSearchString).not.toHaveBeenCalled();
        });
    });

    describe('remix and ratio-based reverse containment', () => {
        it('should detect reverse containment when shorter string is >=50% of longer string length', () => {
            // "Song" (4 chars) vs "Song Remix" (10 chars) - ratio is 0.4, should NOT reverse
            const result1 = compareTitles('Song', 'Song Remix Edition');
            expect(result1.contains).toBe(false);
            
            // "Song Title" (10 chars) vs "Song Title Remix" (16 chars) - ratio is 0.625, should reverse
            const result2 = compareTitles('Song Title', 'Song Title Remix');
            expect(result2.contains).toBe(true);
        });

        it('should handle exact 50% ratio boundary', () => {
            // "Hello" (5 chars) vs "Hello World" (11 chars) - ratio is ~0.45, should NOT reverse
            const result1 = compareTitles('Hello', 'Hello World');
            expect(result1.contains).toBe(false);
            
            // "Hello W" (7 chars) vs "Hello World" (11 chars) - ratio is ~0.636, should reverse
            const result2 = compareTitles('Hello W', 'Hello World');
            expect(result2.contains).toBe(true);
        });

        it('should only apply reverse containment when first string is shorter', () => {
            // When first string is longer, no reverse check should happen
            // But "Song" is only 4 chars, so no contains logic at all
            const result = compareTitles('Very Long Song Title', 'Song');
            expect(result.contains).toBe(false); // "Song" is too short (< 5 chars)
        });

        it('should not apply reverse containment when standard containment already found', () => {
            // When standard containment is found, reverse shouldn't be checked
            const result = compareTitles('Hello World Test', 'World');
            expect(result.contains).toBe(true);
        });

        it('should handle complex remix scenarios', () => {
            // Typical remix scenarios where shorter original should be found in longer remix
            const testCases = [
                { a: 'Midnight', b: 'Midnight (Extended Mix)', expected: false }, // ratio 8/21 = 0.38 < 0.5
                { a: 'Dance Track', b: 'Dance Track (Club Remix)', expected: false }, // ratio 11/25 = 0.44 < 0.5 
                { a: 'Love Song', b: 'Love Song (Acoustic Version)', expected: false }, // ratio 9/26 = 0.35 < 0.5
                { a: 'Beat', b: 'Beat (Ultra Extended Super Remix)', expected: false } // ratio too low
            ];

            testCases.forEach(({ a, b, expected }) => {
                const result = compareTitles(a, b);
                expect(result.contains).toBe(expected);
            });
        });
    });

    describe('boundary case: 5-char first, 4-char second', () => {
        it('should handle exactly 5-char first string with 4-char second string', () => {
            const result = compareTitles('Hello', 'ello');
            expect(result.contains).toBe(true);
        });

        it('should handle exactly 5-char first string with 4-char second string that does not match', () => {
            const result = compareTitles('Hello', 'Bye!');
            expect(result.contains).toBe(false);
        });

        it('should not apply boundary case when first string is not exactly 5 chars', () => {
            // 6 chars first, 4 chars second - "ello" is too short (< 5) so no contains logic
            const result1 = compareTitles('Hellos', 'ello');
            expect(result1.contains).toBe(false); // "ello" is too short
            
            // 4 chars first, 4 chars second - should not use contains at all
            const result2 = compareTitles('Hell', 'ello');
            expect(result2.contains).toBe(false); // Both too short
        });

        it('should not apply boundary case when second string is not exactly 4 chars', () => {
            const result1 = compareTitles('Hello', 'ell'); // 3 chars second
            expect(result1.contains).toBe(false);
            
            const result2 = compareTitles('Hello', 'ellos'); // 5 chars second, normal logic
            expect(result2.contains).toBe(false); // "ellos" not in "Hello"
        });
    });

    describe('comprehensive edge cases and boundary conditions', () => {
        it('should handle null and undefined mixed scenarios', () => {
            const testCases = [
                [null, 'test'],
                ['test', null],
                [null, null],
                [undefined, 'test'],
                ['test', undefined],
                [undefined, undefined]
            ];

            testCases.forEach(([a, b]) => {
                const result = compareTitles(a as any, b as any);
                expect(result).toEqual({ match: false, contains: false, similarity: 0 });
            });
        });

        it('should handle empty and whitespace-only strings', () => {
            const testCases = [
                ['', ''],
                [' ', ' '],
                ['\t', '\n'],
                ['   ', ''],
                ['test', '   '],
                ['   ', 'test']
            ];

            testCases.forEach(([a, b], index) => {
                const result = compareTitles(a, b);
                if (index === 1) {
                    // ' ' vs ' ' becomes empty after trim, but localeCompare treats them as equal
                    expect(result).toEqual({ match: true, contains: false, similarity: 0 });
                } else if (index === 2) {
                    // '\t' vs '\n' becomes empty after trim, localeCompare treats as equal
                    expect(result).toEqual({ match: true, contains: false, similarity: 0 });
                } else {
                    expect(result).toEqual({ match: false, contains: false, similarity: 0 });
                }
            });
        });

        it('should handle strings with only punctuation', () => {
            const result1 = compareTitles('!@#$%', '^&*()');
            expect(result1.match).toBe(false);
            expect(result1.contains).toBe(false); // No overlap between different punctuation
            
            const result2 = compareTitles('!@#$%', '!@#$%');
            expect(result2.match).toBe(true);
        });

        it('should handle mixed case with whitespace trimming', () => {
            const result = compareTitles('   Hello WORLD   ', '\t\nHELLO world\t\n');
            expect(result.match).toBe(true);
            expect(result.contains).toBe(true);
        });

        it('should handle boundary lengths around 5-character threshold', () => {
            const testCases = [
                // Both exactly at boundaries
                { a: 'abcd', b: 'efgh' }, // 4,4
                { a: 'abcde', b: 'fghi' },  // 5,4 - special case
                { a: 'abcde', b: 'fghij' }, // 5,5
                { a: 'abcdef', b: 'ghijk' } // 6,5
            ];

            testCases.forEach(({ a, b }) => {
                const result = compareTitles(a, b);
                // We can't directly test if contains logic was used, but we can verify the behavior
                expect(typeof result.contains).toBe('boolean');
            });
        });
    });

    describe('advanced similarity and matching edge cases', () => {
        it('should handle strings that are similar but not exact matches', () => {
            const testCases = [
                { a: 'Hello World!', b: 'Hello World?', expectMatch: false },
                { a: 'Song (Remix)', b: 'Song(Remix)', expectMatch: false },
                { a: 'Test—Title', b: 'Test-Title', expectMatch: false },
                { a: '1234567890', b: '1234567890', expectMatch: true }
            ];

            testCases.forEach(({ a, b, expectMatch }) => {
                const result = compareTitles(a, b);
                expect(result.match).toBe(expectMatch);
            });
        });

        it('should handle international characters correctly', () => {
            // Test with real createSearchString to see accent normalization
            mockCreateSearchString.mockRestore();
            vi.doUnmock('../../utils/createSearchString');
            
            const result = compareTitles('Café', 'cafe');
            expect(result.match).toBe(true); // localeCompare normalizes accents
            expect(result.contains).toBe(false); // Both only 4 chars, too short for contains
        });

        it('should calculate different similarity scores for different inputs', () => {
            const pairs = [
                ['identical', 'identical'],
                ['similar', 'similae'],
                ['different', 'words'],
                ['hello', 'goodbye']
            ];

            const similarities = pairs.map(([a, b]) => compareTitles(a, b).similarity);
            
            // First should be highest (identical)
            expect(similarities[0]).toBe(1);
            
            // Each subsequent should generally be lower (allowing some flexibility)
            expect(similarities[0]).toBeGreaterThan(similarities[1] ?? 0);
            expect(similarities[1] ?? 0).toBeGreaterThan(similarities[3] ?? 0);
        });
    });

    describe('two-way containment comprehensive testing', () => {
        it('should work bidirectionally for all valid combinations', () => {
            const testCases = [
                // Both directions should work when both >= 5 chars
                { a: 'Hello World', b: 'World', expected: true },
                { a: 'World', b: 'Hello World', expected: true },
                // "Song" is 4 chars, too short for two-way containment
                { a: 'Test Song', b: 'Song', expected: false },
                { a: 'Song', b: 'Test Song', expected: false }
            ];

            testCases.forEach(({ a, b, expected }) => {
                const result = compareTitles(a, b, true);
                expect(result.contains).toBe(expected);
            });
        });

        it('should respect 5-character minimum in two-way mode', () => {
            // Both need to be >= 5 chars for two-way containment
            const result1 = compareTitles('Test', 'Tes', true);
            expect(result1.contains).toBe(false);
            
            const result2 = compareTitles('Testing', 'Test', true);
            expect(result2.contains).toBe(false); // "Test" is only 4 chars
            
            const result3 = compareTitles('Testing', 'Tests', true);
            expect(result3.contains).toBe(false); // "tests" not contained in "testing"
        });
    });

    describe('real-world examples', () => {
        beforeEach(() => {
            // Use actual createSearchString implementation for real-world tests
            mockCreateSearchString.mockRestore();
            vi.doUnmock('../../utils/createSearchString');
        });

        it('should handle music track comparisons', () => {
            const result = compareTitles('Bohemian Rhapsody', 'bohemian rhapsody');
            expect(result.match).toBe(true);
            expect(result.contains).toBe(true);
        });

        it('should handle partial track matches', () => {
            const result = compareTitles('Bohemian Rhapsody (Live)', 'Bohemian Rhapsody');
            expect(result.match).toBe(false);
            expect(result.contains).toBe(true);
        });

        it('should handle remixes and versions', () => {
            const result = compareTitles('Song Title', 'Song Title (Remix)');
            expect(result.match).toBe(false);
            expect(result.contains).toBe(true);
        });

        it('should handle abbreviations', () => {
            const result = compareTitles('ft. Artist Name', 'feat. Artist Name');
            expect(result.similarity).toBeGreaterThan(0.7);
        });

        it('should handle common music industry patterns', () => {
            const testCases = [
                // Original vs Radio Edit - ratio 10/22 = 0.45 < 0.5, no reverse
                { a: 'Track Name', b: 'Track Name (Radio Edit)', expectContains: false },
                // Original vs Extended - ratio 11/30 = 0.37 < 0.5, no reverse 
                { a: 'Dance Track', b: 'Dance Track (Extended Version)', expectContains: false },
                // Different versions
                { a: 'Song (Acoustic)', b: 'Song (Live)', expectContains: false },
                // Featuring variations
                { a: 'Song ft. Artist', b: 'Song feat. Artist', expectContains: false, minSimilarity: 0.8 }
            ];

            testCases.forEach(({ a, b, expectContains, minSimilarity }) => {
                const result = compareTitles(a, b);
                if (expectContains !== undefined) {
                    expect(result.contains).toBe(expectContains);
                }

                if (minSimilarity !== undefined) {
                    expect(result.similarity).toBeGreaterThan(minSimilarity);
                }
            });
        });
    });

    describe('edge cases', () => {
        it('should handle very long titles', () => {
            const longTitle1 = `${'A'.repeat(1000)  } Title`;
            const longTitle2 = `${'A'.repeat(1000)  } Different`;
      
            const result = compareTitles(longTitle1, longTitle2);
            expect(result).toHaveProperty('match');
            expect(result).toHaveProperty('contains');
            expect(result).toHaveProperty('similarity');
        });

        it('should handle special characters', () => {
            const result = compareTitles('Song #1 (2024)', 'Song #1 (2024)');
            expect(result.match).toBe(true);
        });

        it('should handle unicode characters', () => {
            const result = compareTitles('🎵 Music', '🎵 Music');
            expect(result.match).toBe(true);
        });

        it('should handle whitespace variations', () => {
            const result = compareTitles('  Hello World  ', 'Hello World');
            expect(result.match).toBe(true);
        });
    });

    describe('performance', () => {
        it('should handle many comparisons efficiently', () => {
            const titles = Array.from({ length: 100 }, (_, i) => `Title ${i}`);
      
            const start = performance.now();
            titles.forEach((title, i) => {
                titles.slice(i + 1).forEach(otherTitle => {
                    compareTitles(title, otherTitle);
                });
            });
            const end = performance.now();
      
            expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
        });
    });
});