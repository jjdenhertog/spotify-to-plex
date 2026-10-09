import { describe, expect, it } from 'vitest';
import { parseIsoDuration } from './parseIsoDuration';

describe('parseIsoDuration', () => {

    it('reads minutes and seconds', () => {
        expect(parseIsoDuration('PT3M23S')).toBe(203_000);
    });

    it('reads hours and fractional seconds', () => {
        expect(parseIsoDuration('PT1H0M1.5S')).toBe(3_601_500);
    });

    it('returns undefined for missing or unreadable durations', () => {
        expect(parseIsoDuration()).toBeUndefined();
        expect(parseIsoDuration('3:23')).toBeUndefined();
        expect(parseIsoDuration('PT0S')).toBeUndefined();
    });
});
