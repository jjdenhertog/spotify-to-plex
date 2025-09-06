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