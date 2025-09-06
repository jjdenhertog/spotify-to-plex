import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterOutWords } from '../../utils/filterOutWords';
import * as getMusicSearchConfigModule from '../../functions/getMusicSearchConfig';

// Mock the getMusicSearchConfig function
vi.mock('../../functions/getMusicSearchConfig');

const mockGetCurrentMusicSearchConfig = vi.mocked(getMusicSearchConfigModule.getCurrentMusicSearchConfig);

describe('filterOutWords', () => {
    const mockTextProcessingConfig = {
        filterOutWords: ['feat.', 'ft.', 'featuring', 'remix'],
        filterOutQuotes: ['"', "'", '(', ')', '[', ']'],
        cutOffSeparators: ['-', '|', ':', ';']
    };

    const mockMusicSearchConfig = {
        textProcessing: mockTextProcessingConfig,
        // Add other required properties as needed
        searchApproaches: {},
        matchFilters: {}
    };

    beforeEach(() => {
        mockGetCurrentMusicSearchConfig.mockReturnValue(mockMusicSearchConfig as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('basic functionality', () => {
        it('should convert input to lowercase', () => {
            const result = filterOutWords('HELLO WORLD');
            expect(result).toBe('hello world');
        });

        it('should trim whitespace from result', () => {
            const result = filterOutWords('  hello world  ');
            expect(result).toBe('hello world');
        });

        it('should handle empty string', () => {
            const result = filterOutWords('');
            expect(result).toBe('');
        });

        it('should handle whitespace-only string', () => {
            const result = filterOutWords('   ');
            expect(result).toBe('');
        });
    });

    describe('word filtering', () => {
        it('should filter out words when filtered=true', () => {
            const result = filterOutWords('Hello feat. Artist Name', true);
            expect(result).toBe('hello  artist name');
        });

        it('should not filter out words when filtered=false', () => {
            const result = filterOutWords('Hello feat. Artist Name', false);
            expect(result).toBe('hello feat. artist name');
        });

        it('should filter multiple words', () => {
            const result = filterOutWords('Song ft. Artist featuring Someone remix', true);
            expect(result).toBe('song  artist  someone ');
        });

        it('should handle case insensitive filtering', () => {
            const result = filterOutWords('Song FEAT. Artist FT. Someone', true);
            expect(result).toBe('song  artist  someone');
        });

        it('should handle words not in filter list', () => {
            const result = filterOutWords('Regular Song Title', true);
            expect(result).toBe('regular song title');
        });
    });

    describe('quote removal', () => {
        it('should remove quotes when removeQuotes=true', () => {
            const result = filterOutWords('Song "Title" Name', false, false, true);
            expect(result).toBe('song title name');
        });

        it('should not remove quotes when removeQuotes=false', () => {
            const result = filterOutWords('Song "Title" Name', false, false, false);
            expect(result).toBe('song "title" name');
        });

        it('should remove various quote types', () => {
            const result = filterOutWords(`Song "Title" 'Name' (Live) [Version]`, false, false, true);
            expect(result).toBe('song title name live version');
        });

        it('should handle multiple quote characters', () => {
            const result = filterOutWords(`""Song"" ''Title''`, false, false, true);
            expect(result).toBe('song title');
        });
    });

    describe('separator cut-off', () => {
        it('should cut off at separators when cutOffSeparators=true', () => {
            const result = filterOutWords('Song Title - Live Version', false, true);
            expect(result).toBe('song title');
        });

        it('should not cut off when cutOffSeparators=false', () => {
            const result = filterOutWords('Song Title - Live Version', false, false);
            expect(result).toBe('song title - live version');
        });

        it('should cut off at last occurrence of separator', () => {
            const result = filterOutWords('Artist - Song - Live - Remix', false, true);
            expect(result).toBe('artist - song - live');
        });

        it('should handle multiple separator types', () => {
            const config = {
                ...mockMusicSearchConfig,
                textProcessing: {
                    ...mockTextProcessingConfig,
                    cutOffSeparators: ['-', '|', ':']
                }
            };
            mockGetCurrentMusicSearchConfig.mockReturnValue(config as any);

            const result1 = filterOutWords('Song - Version', false, true);
            expect(result1).toBe('song');

            const result2 = filterOutWords('Song | Version', false, true);
            expect(result2).toBe('song');

            const result3 = filterOutWords('Song : Version', false, true);
            expect(result3).toBe('song');
        });

        it('should not cut off if separator not found', () => {
            const result = filterOutWords('Song Title Without Separators', false, true);
            expect(result).toBe('song title without separators');
        });
    });

    describe('empty brackets removal', () => {
        it('should remove empty brackets', () => {
            const result = filterOutWords('Song () Title');
            expect(result).toBe('song  title');
        });

        it('should remove multiple empty brackets', () => {
            const result = filterOutWords('Song () Title () Name');
            expect(result).toBe('song  title  name');
        });

        it('should not remove non-empty brackets', () => {
            const result = filterOutWords('Song (Live) Title');
            expect(result).toBe('song (live) title');
        });
    });

    describe('trailing dash removal', () => {
        it('should remove trailing dashes', () => {
            const result = filterOutWords('Song Title -');
            expect(result).toBe('song title');
        });

        it('should remove multiple trailing dashes', () => {
            const result = filterOutWords('Song Title ----');
            expect(result).toBe('song title');
        });

        it('should not remove dashes from short strings', () => {
            const result = filterOutWords('AB-');
            expect(result).toBe('ab-'); // Length <= 3, so no removal
        });

        it('should handle starting dashes', () => {
            const result = filterOutWords('- Song Title');
            expect(result).toBe('song title');
        });

        it('should not affect middle dashes', () => {
            const result = filterOutWords('Song-Title');
            expect(result).toBe('song-title');
        });
    });

    describe('combined operations', () => {
        it('should apply all filters when all flags are true', () => {
            const result = filterOutWords('Song feat. "Artist" - Live Version ()', true, true, true);
            expect(result).toBe('song  artist');
        });

        it('should handle complex real-world examples', () => {
            const input = 'Bohemian Rhapsody feat. Queen "Live" - Wembley 1986 ()';
            const result = filterOutWords(input, true, true, true);
            expect(result).toBe('bohemian rhapsody  queen live');
        });

        it('should preserve order of operations', () => {
            // Test that operations happen in the correct order
            const input = 'Song feat. Artist - "Live" Version ()';
            const result = filterOutWords(input, true, true, true);
            expect(result).toBe('song  artist');
        });
    });

    describe('edge cases', () => {
        it('should handle strings with only filtered content', () => {
            const result = filterOutWords('feat. ft. remix', true);
            expect(result).toBe('');
        });

        it('should handle repeated separators', () => {
            const result = filterOutWords('Song --- Title', false, true);
            expect(result).toBe('song --');
        });

        it('should handle mixed whitespace', () => {
            const result = filterOutWords('Song\t\nTitle  \r\nName');
            expect(result).toBe('song\t\ntitle  \r\nname');
        });

        it('should handle very long strings', () => {
            const longString = `${'Word '.repeat(1000)  }feat. Artist`;
            const result = filterOutWords(longString, true);
            expect(result).toContain('word');
            expect(result).not.toContain('feat.');
        });

        it('should handle strings with only separators', () => {
            const result = filterOutWords('---|||:::', false, true);
            expect(result).toBe('--');
        });
    });

    describe('configuration dependency', () => {
        it('should call getCurrentMusicSearchConfig', () => {
            filterOutWords('test');
            expect(mockGetCurrentMusicSearchConfig).toHaveBeenCalled();
        });

        it('should use configuration values', () => {
            const customConfig = {
                textProcessing: {
                    filterOutWords: ['custom1', 'custom2'],
                    filterOutQuotes: ['<', '>'],
                    cutOffSeparators: ['@']
                }
            };
            mockGetCurrentMusicSearchConfig.mockReturnValue(customConfig as any);

            const result = filterOutWords('test custom1 <quote> @ extra', true, true, true);
            expect(result).toBe('test  quote');
        });

        it('should handle empty configuration arrays', () => {
            const emptyConfig = {
                textProcessing: {
                    filterOutWords: [],
                    filterOutQuotes: [],
                    cutOffSeparators: []
                }
            };
            mockGetCurrentMusicSearchConfig.mockReturnValue(emptyConfig as any);

            const result = filterOutWords('test feat. "quote" - extra', true, true, true);
            expect(result).toBe('test feat. "quote" - extra');
        });
    });

    describe('performance', () => {
        it('should handle many filter operations efficiently', () => {
            const input = 'Song feat. Artist "Live" - Version'.repeat(100);
      
            const start = performance.now();
            filterOutWords(input, true, true, true);
            const end = performance.now();
      
            expect(end - start).toBeLessThan(100); // Should complete quickly
        });

        it('should handle large filter arrays efficiently', () => {
            const largeConfig = {
                textProcessing: {
                    filterOutWords: Array.from({ length: 1000 }, (_, i) => `word${i}`),
                    filterOutQuotes: Array.from({ length: 100 }, (_, i) => `"${i}"`),
                    cutOffSeparators: Array.from({ length: 50 }, (_, i) => `sep${i}`)
                }
            };
            mockGetCurrentMusicSearchConfig.mockReturnValue(largeConfig as any);

            const start = performance.now();
            filterOutWords('test song with various word99 elements', true, true, true);
            const end = performance.now();
      
            expect(end - start).toBeLessThan(200); // Should still be reasonable
        });
    });
});