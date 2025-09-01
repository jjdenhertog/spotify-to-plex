/**
 * Comprehensive tests for the new expression-based match filter parser
 * Tests all field types, operations, logical combinations, and edge cases
 */

import { TrackWithMatching } from '../packages/music-search/src/types/TrackWithMatching';

// Mock track data for testing
const createMockTrack = (matchingData: Partial<TrackWithMatching['matching']>): TrackWithMatching => ({
    id: 'test-track',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    matching: {
        album: { match: false, contains: false, similarity: 0 },
        title: { match: false, contains: false, similarity: 0 },
        artist: { match: false, contains: false, similarity: 0 },
        artistInTitle: { match: false, contains: false, similarity: 0 },
        artistWithTitle: { match: false, contains: false, similarity: 0 },
        ...matchingData
    }
});

// Expression parser function (to be implemented)
type ExpressionParser = (expression: string) => (item: TrackWithMatching) => boolean;

// Mock implementation for testing - will be replaced with real implementation
const parseExpression: ExpressionParser = (expression: string) => {
    // This is a mock - the real implementation will be created by the coder
    console.warn('Mock parseExpression called with:', expression);
    return () => false;
};

describe('Expression Parser - Field Types', () => {
    describe('Artist field operations', () => {
        test('artist:match should match when artist.match is true', () => {
            const track = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 }
            });
            const filter = parseExpression('artist:match');
            expect(filter(track)).toBe(true);
        });

        test('artist:match should not match when artist.match is false', () => {
            const track = createMockTrack({
                artist: { match: false, contains: true, similarity: 0.9 }
            });
            const filter = parseExpression('artist:match');
            expect(filter(track)).toBe(false);
        });

        test('artist:contains should match when artist.contains is true', () => {
            const track = createMockTrack({
                artist: { match: false, contains: true, similarity: 0.3 }
            });
            const filter = parseExpression('artist:contains');
            expect(filter(track)).toBe(true);
        });

        test('artist:similarity>=0.8 should match when similarity >= 0.8', () => {
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.85 }
            });
            const filter = parseExpression('artist:similarity>=0.8');
            expect(filter(track)).toBe(true);
        });

        test('artist:similarity>=0.8 should not match when similarity < 0.8', () => {
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.75 }
            });
            const filter = parseExpression('artist:similarity>=0.8');
            expect(filter(track)).toBe(false);
        });
    });

    describe('Title field operations', () => {
        test('title:match should match when title.match is true', () => {
            const track = createMockTrack({
                title: { match: true, contains: false, similarity: 0.6 }
            });
            const filter = parseExpression('title:match');
            expect(filter(track)).toBe(true);
        });

        test('title:contains should match when title.contains is true', () => {
            const track = createMockTrack({
                title: { match: false, contains: true, similarity: 0.4 }
            });
            const filter = parseExpression('title:contains');
            expect(filter(track)).toBe(true);
        });

        test('title:similarity>=0.9 should handle high thresholds', () => {
            const track = createMockTrack({
                title: { match: false, contains: false, similarity: 0.95 }
            });
            const filter = parseExpression('title:similarity>=0.9');
            expect(filter(track)).toBe(true);
        });
    });

    describe('Album field operations', () => {
        test('album:match should match when album.match is true', () => {
            const track = createMockTrack({
                album: { match: true, contains: false, similarity: 0.2 }
            });
            const filter = parseExpression('album:match');
            expect(filter(track)).toBe(true);
        });

        test('album:contains should match when album.contains is true', () => {
            const track = createMockTrack({
                album: { match: false, contains: true, similarity: 0.1 }
            });
            const filter = parseExpression('album:contains');
            expect(filter(track)).toBe(true);
        });
    });

    describe('Special field operations', () => {
        test('artistInTitle:match should work correctly', () => {
            const track = createMockTrack({
                artistInTitle: { match: true, contains: false, similarity: 0.7 }
            });
            const filter = parseExpression('artistInTitle:match');
            expect(filter(track)).toBe(true);
        });

        test('artistWithTitle:similarity>=0.85 should work correctly', () => {
            const track = createMockTrack({
                artistWithTitle: { match: false, contains: false, similarity: 0.9 }
            });
            const filter = parseExpression('artistWithTitle:similarity>=0.85');
            expect(filter(track)).toBe(true);
        });
    });
});

describe('Expression Parser - Logical Operations', () => {
    describe('AND operations', () => {
        test('artist:match AND title:match should require both conditions', () => {
            const track1 = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.6 }
            });
            const track2 = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 },
                title: { match: false, contains: false, similarity: 0.6 }
            });

            const filter = parseExpression('artist:match AND title:match');
            expect(filter(track1)).toBe(true);
            expect(filter(track2)).toBe(false);
        });

        test('complex AND chain with three conditions', () => {
            const track = createMockTrack({
                artist: { match: false, contains: true, similarity: 0.5 },
                title: { match: false, contains: true, similarity: 0.6 },
                album: { match: false, contains: true, similarity: 0.3 }
            });

            const filter = parseExpression('artist:contains AND title:contains AND album:contains');
            expect(filter(track)).toBe(true);
        });

        test('AND with similarity thresholds', () => {
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.85 },
                title: { match: false, contains: false, similarity: 0.9 }
            });

            const filter = parseExpression('artist:similarity>=0.8 AND title:similarity>=0.85');
            expect(filter(track)).toBe(true);
        });
    });

    describe('OR operations', () => {
        test('artist:match OR title:match should match when either condition is true', () => {
            const track1 = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 },
                title: { match: false, contains: false, similarity: 0.6 }
            });
            const track2 = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.6 }
            });
            const track3 = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: false, contains: false, similarity: 0.6 }
            });

            const filter = parseExpression('artist:match OR title:match');
            expect(filter(track1)).toBe(true);
            expect(filter(track2)).toBe(true);
            expect(filter(track3)).toBe(false);
        });

        test('complex OR with similarity conditions', () => {
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.95 },
                title: { match: false, contains: false, similarity: 0.3 }
            });

            const filter = parseExpression('artist:similarity>=0.9 OR title:similarity>=0.9');
            expect(filter(track)).toBe(true);
        });
    });

    describe('Parentheses grouping', () => {
        test('(artist:match OR artist:contains) AND title:match', () => {
            const track1 = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.6 }
            });
            const track2 = createMockTrack({
                artist: { match: false, contains: true, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.6 }
            });
            const track3 = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.6 }
            });

            const filter = parseExpression('(artist:match OR artist:contains) AND title:match');
            expect(filter(track1)).toBe(true);
            expect(filter(track2)).toBe(true);
            expect(filter(track3)).toBe(false);
        });

        test('nested parentheses with complex logic', () => {
            const track = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.7 },
                title: { match: false, contains: true, similarity: 0.8 },
                album: { match: true, contains: false, similarity: 0.5 }
            });

            const filter = parseExpression('(artist:match AND (title:contains OR title:similarity>=0.9)) OR album:match');
            expect(filter(track)).toBe(true);
        });
    });

    describe('Mixed AND/OR operations', () => {
        test('artist:match AND title:contains OR album:match', () => {
            const track1 = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 },
                title: { match: false, contains: true, similarity: 0.6 },
                album: { match: false, contains: false, similarity: 0.3 }
            });
            const track2 = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.5 },
                title: { match: false, contains: false, similarity: 0.6 },
                album: { match: true, contains: false, similarity: 0.3 }
            });

            const filter = parseExpression('artist:match AND title:contains OR album:match');
            expect(filter(track1)).toBe(true);
            expect(filter(track2)).toBe(true);
        });
    });
});

describe('Expression Parser - Similarity Thresholds', () => {
    const thresholdTests = [
        { threshold: 0.7, value: 0.8, expected: true },
        { threshold: 0.8, value: 0.8, expected: true },
        { threshold: 0.8, value: 0.79, expected: false },
        { threshold: 0.85, value: 0.85, expected: true },
        { threshold: 0.9, value: 0.95, expected: true },
        { threshold: 0.95, value: 0.94, expected: false },
        { threshold: 1.0, value: 1.0, expected: true },
        { threshold: 0.0, value: 0.0, expected: true }
    ];

    thresholdTests.forEach(({ threshold, value, expected }) => {
        test(`artist:similarity>=${threshold} with value ${value} should return ${expected}`, () => {
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: value }
            });
            const filter = parseExpression(`artist:similarity>=${threshold}`);
            expect(filter(track)).toBe(expected);
        });
    });

    test('decimal precision handling', () => {
        const track = createMockTrack({
            title: { match: false, contains: false, similarity: 0.8333333 }
        });
        const filter = parseExpression('title:similarity>=0.83');
        expect(filter(track)).toBe(true);
    });
});

describe('Expression Parser - Edge Cases', () => {
    describe('Invalid expressions', () => {
        test('empty expression should return false', () => {
            const track = createMockTrack({});
            const filter = parseExpression('');
            expect(filter(track)).toBe(false);
        });

        test('invalid field name should return false', () => {
            const track = createMockTrack({});
            const filter = parseExpression('invalidField:match');
            expect(filter(track)).toBe(false);
        });

        test('invalid operation should return false', () => {
            const track = createMockTrack({});
            const filter = parseExpression('artist:invalidOp');
            expect(filter(track)).toBe(false);
        });

        test('malformed similarity threshold should return false', () => {
            const track = createMockTrack({});
            const filter = parseExpression('artist:similarity>=invalid');
            expect(filter(track)).toBe(false);
        });

        test('unbalanced parentheses should return false', () => {
            const track = createMockTrack({});
            const filter1 = parseExpression('(artist:match');
            const filter2 = parseExpression('artist:match)');
            expect(filter1(track)).toBe(false);
            expect(filter2(track)).toBe(false);
        });

        test('incomplete AND/OR expressions should return false', () => {
            const track = createMockTrack({});
            const filter1 = parseExpression('artist:match AND');
            const filter2 = parseExpression('OR title:match');
            expect(filter1(track)).toBe(false);
            expect(filter2(track)).toBe(false);
        });
    });

    describe('Boundary conditions', () => {
        test('similarity threshold of 0 should always match', () => {
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: 0 }
            });
            const filter = parseExpression('artist:similarity>=0');
            expect(filter(track)).toBe(true);
        });

        test('similarity threshold of 1 should only match perfect similarity', () => {
            const track1 = createMockTrack({
                artist: { match: false, contains: false, similarity: 1.0 }
            });
            const track2 = createMockTrack({
                artist: { match: false, contains: false, similarity: 0.99 }
            });
            const filter = parseExpression('artist:similarity>=1');
            expect(filter(track1)).toBe(true);
            expect(filter(track2)).toBe(false);
        });

        test('undefined similarity should be treated as 0', () => {
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: undefined as any }
            });
            const filter = parseExpression('artist:similarity>=0.5');
            expect(filter(track)).toBe(false);
        });

        test('null similarity should be treated as 0', () => {
            const track = createMockTrack({
                artist: { match: false, contains: false, similarity: null as any }
            });
            const filter = parseExpression('artist:similarity>=0.1');
            expect(filter(track)).toBe(false);
        });
    });

    describe('Whitespace handling', () => {
        test('extra whitespace should be ignored', () => {
            const track = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.6 }
            });
            
            const expressions = [
                'artist:match AND title:match',
                ' artist:match AND title:match ',
                'artist:match  AND  title:match',
                'artist:match\tAND\ttitle:match',
                'artist:match\nAND\ntitle:match'
            ];

            expressions.forEach(expr => {
                const filter = parseExpression(expr);
                expect(filter(track)).toBe(true);
            });
        });
    });

    describe('Case sensitivity', () => {
        test('operators should be case insensitive', () => {
            const track = createMockTrack({
                artist: { match: true, contains: false, similarity: 0.5 },
                title: { match: true, contains: false, similarity: 0.6 }
            });

            const expressions = [
                'artist:match AND title:match',
                'artist:match and title:match',
                'artist:match And title:match',
                'artist:match OR title:match',
                'artist:match or title:match',
                'artist:match Or title:match'
            ];

            expressions.forEach(expr => {
                const filter = parseExpression(expr);
                // Should not throw error and should handle consistently
                expect(() => filter(track)).not.toThrow();
            });
        });
    });
});

describe('Expression Parser - Security Tests', () => {
    test('should not use eval() or new Function()', () => {
        // This test will be verified by examining the actual implementation
        const track = createMockTrack({});
        
        // These malicious expressions should not execute arbitrary code
        const maliciousExpressions = [
            'eval("console.log(\"hacked\")")',
            'new Function("return process.env")()',
            'artist:match; process.exit(1)',
            'artist:match && (function(){return process.env})()',
            '__proto__.constructor.constructor("return process")()',
            'constructor.constructor("return process")()'
        ];

        maliciousExpressions.forEach(expr => {
            const filter = parseExpression(expr);
            expect(() => filter(track)).not.toThrow();
            expect(filter(track)).toBe(false);
        });
    });

    test('should sanitize input and prevent injection', () => {
        const track = createMockTrack({
            artist: { match: true, contains: false, similarity: 0.8 }
        });

        const injectionAttempts = [
            'artist:match<script>alert("xss")</script>',
            'artist:match${process.env}',
            'artist:match`rm -rf /`',
            'artist:match/*comment*/OR/**/title:match'
        ];

        injectionAttempts.forEach(expr => {
            const filter = parseExpression(expr);
            expect(() => filter(track)).not.toThrow();
            // Should either safely parse or return false
            expect(typeof filter(track)).toBe('boolean');
        });
    });

    test('should handle extremely long expressions safely', () => {
        const track = createMockTrack({
            artist: { match: true, contains: false, similarity: 0.8 }
        });

        // Create very long expression
        const longExpression = Array(1000).fill('artist:match').join(' OR ');
        
        const filter = parseExpression(longExpression);
        expect(() => filter(track)).not.toThrow();
    });

    test('should handle deeply nested expressions safely', () => {
        const track = createMockTrack({
            artist: { match: true, contains: false, similarity: 0.8 }
        });

        // Create deeply nested parentheses
        let nestedExpression = 'artist:match';
        for (let i = 0; i < 100; i++) {
            nestedExpression = `(${nestedExpression})`;
        }
        
        const filter = parseExpression(nestedExpression);
        expect(() => filter(track)).not.toThrow();
    });
});

describe('Expression Parser - Performance Tests', () => {
    test('should parse simple expressions quickly', () => {
        const start = performance.now();
        
        for (let i = 0; i < 1000; i++) {
            parseExpression('artist:match AND title:match');
        }
        
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(100); // Should parse 1000 expressions in <100ms
    });

    test('should execute filters quickly', () => {
        const track = createMockTrack({
            artist: { match: true, contains: false, similarity: 0.8 },
            title: { match: true, contains: false, similarity: 0.9 }
        });

        const filter = parseExpression('artist:match AND title:match OR album:contains');
        
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
            filter(track);
        }
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(100); // Should execute 10k filters in <100ms
    });

    test('complex expressions should remain performant', () => {
        const track = createMockTrack({
            artist: { match: true, contains: true, similarity: 0.8 },
            title: { match: true, contains: true, similarity: 0.9 },
            album: { match: true, contains: true, similarity: 0.7 }
        });

        const complexExpression = '(artist:match AND title:similarity>=0.85) OR (artist:contains AND title:contains AND album:contains) OR (artistWithTitle:similarity>=0.9)';
        const filter = parseExpression(complexExpression);
        
        const start = performance.now();
        for (let i = 0; i < 5000; i++) {
            filter(track);
        }
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(100); // Should execute 5k complex filters in <100ms
    });
});