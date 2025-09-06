import { describe, it, expect } from 'vitest';
import { removeFeaturing } from '../../utils/removeFeaturing';

describe('removeFeaturing', () => {
    describe('happy path', () => {
        it('returns clean song titles', () => {
            expect(removeFeaturing('Song Title')).toBe('Song Title');
        });

        it('removes feat markers', () => {
            expect(removeFeaturing('Song Title feat Artist')).toBe('Song Title ');
            expect(removeFeaturing('Song Title feat. Artist')).toBe('Song Title ');
        });

        it('removes parentheses content', () => {
            expect(removeFeaturing('Song Title (Live Version)')).toBe('Song Title ');
        });

        it('prioritizes first occurrence', () => {
            expect(removeFeaturing('Song feat. Artist (Live)')).toBe('Song ');
            expect(removeFeaturing('Song (Live) feat. Artist')).toBe('Song ');
        });
    });

    describe('edge cases', () => {
        it.each([
            ['', ''], // empty string
            ['(', ''], // only opening parenthesis
            ['feat', ''], // only feat keyword
            ['a', 'a'] // single character
        ])('handles boundary inputs: "%s" -> "%s"', (input, expected) => {
            expect(removeFeaturing(input)).toBe(expected);
        });

        it('removes from first "feat" occurrence', () => {
            expect(removeFeaturing('Defeat the Enemy')).toBe('De');
            expect(removeFeaturing('Feature Film')).toBe('Feature Film'); // "feat" not found in "Feature"
        });

        it('handles case sensitivity', () => {
            expect(removeFeaturing('Song FEAT Artist')).toBe('Song FEAT Artist');
            expect(removeFeaturing('Song Feat Artist')).toBe('Song Feat Artist');
        });

        it('ignores closing parenthesis only', () => {
            expect(removeFeaturing('Song Title) Extra')).toBe('Song Title) Extra');
        });
    });

    describe('error handling', () => {
        it('handles null and undefined inputs', () => {
            expect(removeFeaturing()).toBe('');
            expect(removeFeaturing()).toBe('');
            // Note: null will throw error - function doesn't handle it
            expect(() => removeFeaturing(null as any)).toThrow();
        });
    });

    describe('real-world examples', () => {
        it.each([
            ['Despacito feat. Justin Bieber', 'Despacito '],
            ['Bohemian Rhapsody (Live Aid 1985)', 'Bohemian Rhapsody ']
        ])('processes common patterns: "%s"', (input, expected) => {
            expect(removeFeaturing(input)).toBe(expected);
        });
    });
});