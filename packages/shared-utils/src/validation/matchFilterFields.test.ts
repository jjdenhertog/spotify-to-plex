import { describe, expect, it } from 'vitest';
import { MATCH_FILTER_FIELDS } from './matchFilterFields';
import { matchFilterFieldPattern } from './matchFilterFieldPattern';

describe('matchFilterFieldPattern', () => {

    it('accepts every field in the constant', () => {
        const pattern = new RegExp(`^${matchFilterFieldPattern()}$`);

        for (const field of MATCH_FILTER_FIELDS)
            expect(pattern.test(field), field).toBe(true);
    });

    it('rejects a field that is not in the constant', () => {
        const pattern = new RegExp(`^${matchFilterFieldPattern()}$`);

        expect(pattern.test('bogus')).toBe(false);
    });

    it('rejects near-misses of a real field', () => {
        const pattern = new RegExp(`^${matchFilterFieldPattern()}$`);

        expect(pattern.test('durations')).toBe(false);
        expect(pattern.test('versionx')).toBe(false);
        expect(pattern.test('artis')).toBe(false);
    });

    it('carries the fields the matcher actually supports', () => {
        expect([...MATCH_FILTER_FIELDS].sort()).toEqual([
            'album',
            'artist',
            'artistInTitle',
            'artistWithTitle',
            'duration',
            'title',
            'version'
        ]);
    });

});
