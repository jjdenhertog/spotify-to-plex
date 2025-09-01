/**
 * Performance tests to ensure expression parser is comparable or faster than legacy implementation
 */

import { TrackWithMatching } from '../packages/music-search/src/types/TrackWithMatching';
import { parseExpression } from '../packages/music-search/src/functions/parseExpression';

// Mock track data for performance testing
const createMockTrack = (index: number): TrackWithMatching => ({
    id: `track-${index}`,
    title: `Test Song ${index}`,
    artist: `Test Artist ${index % 10}`,
    album: `Test Album ${index % 5}`,
    duration: 180 + (index % 60),
    matching: {
        album: { 
            match: index % 4 === 0, 
            contains: index % 3 === 0, 
            similarity: Math.random() 
        },
        title: { 
            match: index % 5 === 0, 
            contains: index % 2 === 0, 
            similarity: Math.random() 
        },
        artist: { 
            match: index % 6 === 0, 
            contains: index % 3 === 0, 
            similarity: Math.random() 
        },
        artistInTitle: { 
            match: index % 10 === 0, 
            contains: index % 7 === 0, 
            similarity: Math.random() 
        },
        artistWithTitle: { 
            match: index % 8 === 0, 
            contains: index % 4 === 0, 
            similarity: Math.random() 
        }
    }
});

// Legacy function compiler (current implementation)
const compileLegacyFunction = (filterString: string): (item: TrackWithMatching) => boolean => {
    try {
        return new Function('item', `return ${filterString.replace(/^\(item\)\s*=>\s*/, '')};`) as (item: TrackWithMatching) => boolean;
    } catch (error) {
        return () => false;
    }
};

describe('Performance Tests', () => {
    const testTrack = createMockTrack(42);
    const trackBatch = Array.from({ length: 1000 }, (_, i) => createMockTrack(i));
    
    describe('Expression Parser Performance', () => {
        test('simple expression should parse quickly', () => {
            const expression = 'artist:match AND title:contains';
            
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                parseExpression(expression);
            }
            const duration = performance.now() - start;
            
            expect(duration).toBeLessThan(50); // Should parse 1000 expressions in <50ms
            console.log(`Parsed 1000 simple expressions in ${duration.toFixed(2)}ms`);
        });

        test('complex expression should parse efficiently', () => {
            const expression = '(artist:match OR artist:similarity>=0.8) AND (title:contains OR title:similarity>=0.85) AND album:contains';
            
            const start = performance.now();
            for (let i = 0; i < 500; i++) {
                parseExpression(expression);
            }
            const duration = performance.now() - start;
            
            expect(duration).toBeLessThan(100); // Should parse 500 complex expressions in <100ms
            console.log(`Parsed 500 complex expressions in ${duration.toFixed(2)}ms`);
        });

        test('expression execution should be fast', () => {
            const filter = parseExpression('artist:match AND title:similarity>=0.8');
            
            const start = performance.now();
            for (let i = 0; i < 10000; i++) {
                filter(testTrack);
            }
            const duration = performance.now() - start;
            
            expect(duration).toBeLessThan(50); // Should execute 10k filters in <50ms
            console.log(`Executed 10k simple filters in ${duration.toFixed(2)}ms`);
        });

        test('batch processing should be efficient', () => {
            const filter = parseExpression('artist:contains AND title:similarity>=0.7');
            
            const start = performance.now();
            const results = trackBatch.filter(filter);
            const duration = performance.now() - start;
            
            expect(duration).toBeLessThan(50); // Should filter 1000 tracks in <50ms
            expect(Array.isArray(results)).toBe(true);
            console.log(`Filtered 1000 tracks in ${duration.toFixed(2)}ms, found ${results.length} matches`);
        });
    });

    describe('Performance Comparison with Legacy', () => {
        const testCases = [
            {
                name: 'Simple AND condition',
                legacy: '(item) => item.matching.artist.match && item.matching.title.match',
                expression: 'artist:match AND title:match'
            },
            {
                name: 'Contains operations',
                legacy: '(item) => item.matching.artist.contains && item.matching.title.contains',
                expression: 'artist:contains AND title:contains'
            },
            {
                name: 'Similarity threshold',
                legacy: '(item) => (item.matching.artist.similarity ?? 0) >= 0.8 && (item.matching.title.similarity ?? 0) >= 0.85',
                expression: 'artist:similarity>=0.8 AND title:similarity>=0.85'
            },
            {
                name: 'Complex three-way AND',
                legacy: '(item) => item.matching.artist.contains && item.matching.title.contains && item.matching.album.contains',
                expression: 'artist:contains AND title:contains AND album:contains'
            }
        ];

        testCases.forEach(({ name, legacy, expression }) => {
            test(`should perform comparably to legacy: ${name}`, () => {
                // Compile both versions
                const legacyFilter = compileLegacyFunction(legacy);
                const expressionFilter = parseExpression(expression);
                
                // Test correctness first - both should give same results
                const legacyResults = trackBatch.map(track => legacyFilter(track));
                const expressionResults = trackBatch.map(track => expressionFilter(track));
                
                expect(expressionResults).toEqual(legacyResults);
                
                // Performance test - legacy
                const legacyStart = performance.now();
                for (let i = 0; i < 1000; i++) {
                    trackBatch.forEach(track => legacyFilter(track));
                }
                const legacyDuration = performance.now() - legacyStart;
                
                // Performance test - expression
                const expressionStart = performance.now();
                for (let i = 0; i < 1000; i++) {
                    trackBatch.forEach(track => expressionFilter(track));
                }
                const expressionDuration = performance.now() - expressionStart;
                
                console.log(`${name}:`);
                console.log(`  Legacy: ${legacyDuration.toFixed(2)}ms`);
                console.log(`  Expression: ${expressionDuration.toFixed(2)}ms`);
                console.log(`  Speedup: ${(legacyDuration / expressionDuration).toFixed(2)}x`);
                
                // Expression parser should be at least as fast or allow 2x tolerance
                expect(expressionDuration).toBeLessThanOrEqual(legacyDuration * 2);
            });
        });
    });

    describe('Memory Usage', () => {
        test('should not leak memory with repeated parsing', () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Parse many expressions
            for (let i = 0; i < 10000; i++) {
                const expression = `artist:similarity>=${(i % 100) / 100} AND title:match`;
                const filter = parseExpression(expression);
                filter(testTrack); // Execute once to ensure it's fully initialized
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Should not increase memory by more than 50MB
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
            console.log(`Memory increase after 10k expressions: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        });

        test('should handle concurrent execution efficiently', () => {
            const filters = [
                parseExpression('artist:match AND title:contains'),
                parseExpression('artist:similarity>=0.8 OR title:similarity>=0.9'),
                parseExpression('(artist:contains OR title:match) AND album:contains')
            ];
            
            const start = performance.now();
            
            // Simulate concurrent filtering
            const promises = filters.map(filter => 
                Promise.resolve().then(() => {
                    for (let i = 0; i < 1000; i++) {
                        trackBatch.forEach(track => filter(track));
                    }
                })
            );
            
            return Promise.all(promises).then(() => {
                const duration = performance.now() - start;
                console.log(`Concurrent execution of 3 filters x 1000 iterations: ${duration.toFixed(2)}ms`);
                expect(duration).toBeLessThan(500); // Should complete in reasonable time
            });
        });
    });

    describe('Real-world Scenarios', () => {
        test('should handle typical music matching workload', () => {
            // Simulate a typical music search with various criteria
            const searchFilters = [
                'artist:match AND title:match', // Exact match
                'artist:match AND title:contains', // Good artist, partial title
                'artist:contains AND title:similarity>=0.8', // Fuzzy matching
                'artist:similarity>=0.85 AND title:similarity>=0.85', // High similarity
                'artistWithTitle:similarity>=0.9', // Combined field matching
            ];
            
            const compiledFilters = searchFilters.map(expr => parseExpression(expr));
            
            const start = performance.now();
            
            // Process each track through all filters (simulating search ranking)
            trackBatch.forEach(track => {
                compiledFilters.forEach(filter => filter(track));
            });
            
            const duration = performance.now() - start;
            
            console.log(`Processed ${trackBatch.length} tracks through ${searchFilters.length} filters in ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(100); // Should process quickly
        });

        test('should scale well with larger datasets', () => {
            const largeTrackBatch = Array.from({ length: 10000 }, (_, i) => createMockTrack(i));
            const filter = parseExpression('(artist:match OR artist:similarity>=0.8) AND title:contains');
            
            const start = performance.now();
            const results = largeTrackBatch.filter(filter);
            const duration = performance.now() - start;
            
            console.log(`Filtered ${largeTrackBatch.length} tracks in ${duration.toFixed(2)}ms, found ${results.length} matches`);
            console.log(`Performance: ${(largeTrackBatch.length / duration * 1000).toFixed(0)} tracks/second`);
            
            expect(duration).toBeLessThan(500); // Should handle 10k tracks in <500ms
            expect(results.length).toBeGreaterThan(0); // Should find some matches
        });
    });
});