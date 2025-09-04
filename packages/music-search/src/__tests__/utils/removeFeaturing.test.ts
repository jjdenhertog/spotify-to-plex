import { describe, it, expect } from 'vitest';
import { removeFeaturing } from '../../utils/removeFeaturing';

describe('removeFeaturing', () => {
  describe('basic functionality', () => {
    it('should return empty string for empty input', () => {
      expect(removeFeaturing('')).toBe('');
    });

    it('should return unchanged string when no featuring or parentheses', () => {
      expect(removeFeaturing('Regular Song Title')).toBe('Regular Song Title');
    });

    it('should handle undefined input with default parameter', () => {
      expect(removeFeaturing()).toBe('');
    });

    it('should handle null-like values', () => {
      expect(removeFeaturing(null as any)).toBe('');
      expect(removeFeaturing(undefined)).toBe('');
    });
  });

  describe('featuring removal', () => {
    it('should remove everything from "feat" onwards', () => {
      expect(removeFeaturing('Song Title feat Artist')).toBe('Song Title ');
    });

    it('should handle "feat." with period', () => {
      expect(removeFeaturing('Song Title feat. Artist Name')).toBe('Song Title ');
    });

    it('should handle "featuring" full word', () => {
      expect(removeFeaturing('Song Title featuring Artist')).toBe('Song Title ');
    });

    it('should work with first occurrence of feat', () => {
      expect(removeFeaturing('Song feat. Artist feat. Another')).toBe('Song ');
    });

    it('should handle feat at the beginning', () => {
      expect(removeFeaturing('feat. Artist - Song')).toBe('');
    });

    it('should be case sensitive for "feat"', () => {
      expect(removeFeaturing('Song FEAT Artist')).toBe('Song FEAT Artist');
      expect(removeFeaturing('Song Feat Artist')).toBe('Song Feat Artist');
    });

    it('should not affect words containing "feat"', () => {
      expect(removeFeaturing('Defeat the Enemy')).toBe('Defeat the Enemy');
      expect(removeFeaturing('Feature Film')).toBe('Feature Film');
    });
  });

  describe('parentheses removal', () => {
    it('should remove everything from opening parenthesis onwards', () => {
      expect(removeFeaturing('Song Title (Live Version)')).toBe('Song Title ');
    });

    it('should handle parentheses with various content', () => {
      expect(removeFeaturing('Song (Remix)')).toBe('Song ');
      expect(removeFeaturing('Song (feat. Artist)')).toBe('Song ');
      expect(removeFeaturing('Song (2024 Remaster)')).toBe('Song ');
    });

    it('should work with first occurrence of parenthesis', () => {
      expect(removeFeaturing('Song (Live) (Studio)')).toBe('Song ');
    });

    it('should handle parenthesis at the beginning', () => {
      expect(removeFeaturing('(Intro) Song Title')).toBe('');
    });

    it('should handle nested or multiple parentheses', () => {
      expect(removeFeaturing('Song ((Remix))')).toBe('Song ');
    });

    it('should not be affected by closing parenthesis only', () => {
      expect(removeFeaturing('Song Title) Extra')).toBe('Song Title) Extra');
    });
  });

  describe('combined removal logic', () => {
    it('should prioritize feat over parentheses when feat comes first', () => {
      expect(removeFeaturing('Song feat. Artist (Live)')).toBe('Song ');
    });

    it('should prioritize parentheses over feat when parentheses come first', () => {
      expect(removeFeaturing('Song (Live) feat. Artist')).toBe('Song ');
    });

    it('should handle both feat and parentheses in various combinations', () => {
      expect(removeFeaturing('Song Title feat. Artist (Live Version)')).toBe('Song Title ');
      expect(removeFeaturing('Song Title (feat. Artist)')).toBe('Song Title ');
    });

    it('should handle edge case where both are at the same position', () => {
      expect(removeFeaturing('Song feat(Artist)')).toBe('Song ');
    });
  });

  describe('edge cases', () => {
    it('should handle very short strings', () => {
      expect(removeFeaturing('a')).toBe('a');
      expect(removeFeaturing('(')).toBe('');
      expect(removeFeaturing('feat')).toBe('');
    });

    it('should handle strings with only feat or parentheses', () => {
      expect(removeFeaturing('feat')).toBe('');
      expect(removeFeaturing('feat.')).toBe('');
      expect(removeFeaturing('(')).toBe('');
      expect(removeFeaturing('()')).toBe('');
    });

    it('should handle whitespace around markers', () => {
      expect(removeFeaturing('Song  feat  Artist')).toBe('Song  ');
      expect(removeFeaturing('Song  (  Live  )')).toBe('Song  ');
    });

    it('should handle special characters', () => {
      expect(removeFeaturing('Song Title feat. Артист')).toBe('Song Title ');
      expect(removeFeaturing('Song Title (Live @ Venue)')).toBe('Song Title ');
    });

    it('should handle very long strings', () => {
      const longSong = 'A'.repeat(1000) + ' feat. Artist';
      const result = removeFeaturing(longSong);
      expect(result).toBe('A'.repeat(1000) + ' ');
    });

    it('should handle strings with numbers', () => {
      expect(removeFeaturing('Track 01 feat. Artist')).toBe('Track 01 ');
      expect(removeFeaturing('Song (Track 1)')).toBe('Song ');
    });
  });

  describe('real-world examples', () => {
    it('should handle common music title patterns', () => {
      expect(removeFeaturing('Bohemian Rhapsody (Live Aid 1985)')).toBe('Bohemian Rhapsody ');
      expect(removeFeaturing('Shape of You feat. Ed Sheeran')).toBe('Shape of You ');
      expect(removeFeaturing('Hotel California (Eagles Greatest Hits)')).toBe('Hotel California ');
    });

    it('should handle remix and version indicators', () => {
      expect(removeFeaturing('Song Title (Radio Edit)')).toBe('Song Title ');
      expect(removeFeaturing('Song Title (Extended Version)')).toBe('Song Title ');
      expect(removeFeaturing('Song Title (Club Mix)')).toBe('Song Title ');
    });

    it('should handle featuring variations in real usage', () => {
      expect(removeFeaturing('Despacito feat. Justin Bieber')).toBe('Despacito ');
      expect(removeFeaturing('Old Town Road feat. Billy Ray Cyrus')).toBe('Old Town Road ');
      expect(removeFeaturing('Uptown Funk feat. Bruno Mars')).toBe('Uptown Funk ');
    });

    it('should handle multiple artists and complex titles', () => {
      expect(removeFeaturing('Song feat. Artist 1, Artist 2 & Artist 3')).toBe('Song ');
      expect(removeFeaturing('Long Song Title feat. Very Long Artist Name')).toBe('Long Song Title ');
    });
  });

  describe('performance', () => {
    it('should handle large numbers of operations efficiently', () => {
      const titles = Array.from({ length: 1000 }, (_, i) => `Song ${i} feat. Artist`);
      
      const start = performance.now();
      titles.forEach(title => removeFeaturing(title));
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle very long strings efficiently', () => {
      const longTitle = 'Word '.repeat(10000) + 'feat. Artist';
      
      const start = performance.now();
      const result = removeFeaturing(longTitle);
      const end = performance.now();
      
      expect(result).toContain('Word');
      expect(result).not.toContain('feat.');
      expect(end - start).toBeLessThan(50); // Should be very fast even for long strings
    });
  });

  describe('consistency and idempotency', () => {
    it('should be idempotent for strings without markers', () => {
      const clean = 'Clean Song Title';
      expect(removeFeaturing(removeFeaturing(clean))).toBe(clean);
    });

    it('should be consistent with repeated calls', () => {
      const title = 'Song feat. Artist (Live)';
      const result1 = removeFeaturing(title);
      const result2 = removeFeaturing(title);
      expect(result1).toBe(result2);
    });

    it('should handle already processed strings gracefully', () => {
      const processed = removeFeaturing('Song feat. Artist');
      const doubleProcessed = removeFeaturing(processed);
      expect(processed).toBe(doubleProcessed);
    });
  });
});