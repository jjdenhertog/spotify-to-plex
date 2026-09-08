import { describe, expect, it } from 'vitest';
import { durationSimilarity } from './durationSimilarity';

describe('durationSimilarity', () => {

    it('scores identical durations as a perfect match', () => {
        expect(durationSimilarity(183_000, 183_000)).toBe(1);
    });

    it('scores 0 when either duration is missing', () => {
        expect(durationSimilarity(undefined, 183_000)).toBe(0);
        expect(durationSimilarity(183_000)).toBe(0);
        expect(durationSimilarity()).toBe(0);
    });

    it('scores 0 when a duration is zero', () => {
        expect(durationSimilarity(0, 183_000)).toBe(0);
    });

    it('keeps radio versus album variance above 0.65', () => {
        // 3:03 single against a 3:29 album cut
        expect(durationSimilarity(183_000, 209_000)).toBeGreaterThan(0.65);
    });

    it('drops a wrong-version match below 0.65', () => {
        // 3:03 orchestral cover against Faithless' 8:42 Insomnia
        expect(durationSimilarity(183_000, 522_000)).toBeLessThan(0.65);
    });

    it('is symmetric', () => {
        expect(durationSimilarity(183_000, 209_000)).toBe(durationSimilarity(209_000, 183_000));
    });

});
