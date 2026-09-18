import { describe, expect, it } from 'vitest';
import { validateExpression } from './validateExpression';

// version and duration shipped selectable but unsaveable in #138, because three
// copies of the field list still carried the old set. These are the expressions
// that failed then
describe('validateExpression', () => {

    it.each([
        'artist:match AND title:match',
        'version:match',
        'duration:similarity>=0.65',
        'artist:match AND title:match AND version:match',
        'artist:match AND title:match AND duration:similarity>=0.65',
        'artistWithTitle:similarity>=0.9 AND duration:similarity>=0.65'
    ])('accepts %s', expression => {
        expect(validateExpression(expression).valid).toBe(true);
    });

    it.each([
        'bogus:match',
        'durations:match',
        'versionx:match'
    ])('rejects %s', expression => {
        expect(validateExpression(expression).valid).toBe(false);
    });

    it('names the offending field when it rejects one', () => {
        const { errors } = validateExpression('bogus:match');

        expect(errors.join(' ')).toContain('bogus');
    });

});
