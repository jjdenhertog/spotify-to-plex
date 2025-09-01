/**
 * Migration tests for converting legacy function strings to new expressions
 * Tests all 13 current default rules and ensures backward compatibility
 */

import { TrackWithMatching } from '../packages/music-search/src/types/TrackWithMatching';
import { MatchFilterConfig } from '../packages/music-search/src/types/MatchFilterConfig';

// Legacy filter configurations from current system
const LEGACY_FILTERS: MatchFilterConfig[] = [
    {
        reason: 'Full match on Artist & Title',
        filter: '(item) => item.matching.artist.match && item.matching.title.match'
    },
    {
        reason: 'Artsit matches and Title contains',
        filter: '(item) => item.matching.artist.match && item.matching.title.contains'
    },
    {
        reason: 'Artist matches and Title has 80% similarity',
        filter: '(item) => item.matching.artist.match && (item.matching.title.similarity ?? 0) >= 0.8'
    },
    {
        reason: 'Artsit contains and Title matches',
        filter: '(item) => item.matching.artist.contains && item.matching.title.match'
    },
    {
        reason: 'Artist contains and Title has 85% similarity',
        filter: '(item) => item.matching.artist.contains && (item.matching.title.similarity ?? 0) >= 0.85'
    },
    {
        reason: 'Artist contains and Title contains and Album contains',
        filter: '(item) => item.matching.artist.contains && item.matching.title.contains && item.matching.album.contains'
    },
    {
        reason: 'Artist and Title has 85% similarity',
        filter: '(item) => (item.matching.artist.similarity ?? 0) >= 0.85 && (item.matching.title.similarity ?? 0) >= 0.85'
    },
    {
        reason: 'Artist with Title and Title has 85% similarity',
        filter: '(item) => (item.matching.artistWithTitle.similarity ?? 0) >= 0.8 && (item.matching.title.similarity ?? 0) >= 0.9'
    },
    {
        reason: 'Artist with Title has 85% similarity',
        filter: '(item) => (item.matching.artistWithTitle.similarity ?? 0) >= 0.95'
    },
    {
        reason: 'Artist and Title contains',
        filter: '(item) => item.matching.artist.contains && item.matching.title.contains'
    },
    {
        reason: 'Artist has 70% similarity, Album and Title matches',
        filter: '(item) => (item.matching.artist.similarity ?? 0) >= 0.7 && item.matching.album.match && item.matching.title.match'
    },
    {
        reason: 'Artist has 70% similarity, Album matchs and Title has 85% similarity',
        filter: '(item) => (item.matching.artist.similarity ?? 0) >= 0.7 && item.matching.album.match && (item.matching.title.similarity ?? 0) >= 0.85'
    },
    {
        reason: 'Album matches, Artist contains and Title has 80% similiarity',
        filter: '(item) => item.matching.album.match && item.matching.artist.contains && (item.matching.title.similarity ?? 0) >= 0.8'
    }
];

// Expected expressions after migration
const EXPECTED_EXPRESSIONS: string[] = [
    'artist:match AND title:match',
    'artist:match AND title:contains',
    'artist:match AND title:similarity>=0.8',
    'artist:contains AND title:match',
    'artist:contains AND title:similarity>=0.85',
    'artist:contains AND title:contains AND album:contains',
    'artist:similarity>=0.85 AND title:similarity>=0.85',
    'artistWithTitle:similarity>=0.8 AND title:similarity>=0.9',
    'artistWithTitle:similarity>=0.95',
    'artist:contains AND title:contains',
    'artist:similarity>=0.7 AND album:match AND title:match',
    'artist:similarity>=0.7 AND album:match AND title:similarity>=0.85',
    'album:match AND artist:contains AND title:similarity>=0.8'
];

// Mock migration function (to be implemented)
type MigrationFunction = (legacyFilter: string) => string;

const migrateLegacyFilter: MigrationFunction = (legacyFilter: string) => {
    // Mock implementation - will be replaced with real migration logic
    console.warn('Mock migrateLegacyFilter called with:', legacyFilter);
    return 'artist:match'; // placeholder
};

// Mock expression parser (to be implemented)
type ExpressionParser = (expression: string) => (item: TrackWithMatching) => boolean;

const parseExpression: ExpressionParser = (expression: string) => {
    console.warn('Mock parseExpression called with:', expression);
    return () => false;
};

// Mock legacy function compiler (current system)
const compileLegacyFunction = (filterString: string): (item: TrackWithMatching) => boolean => {
    try {
        // This mimics the current new Function() approach but safely for testing
        return new Function('item', `return ${filterString.replace(/^\(item\)\s*=>\s*/, '')};`) as (item: TrackWithMatching) => boolean;
    } catch (error) {
        return () => false;
    }
};

// Mock track data generator
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

describe('Migration Tests - Legacy to Expression Conversion', () => {
    describe('Basic migration patterns', () => {
        test('should migrate simple artist match filter', () => {
            const legacyFilter = '(item) => item.matching.artist.match && item.matching.title.match';
            const expression = migrateLegacyFilter(legacyFilter);
            expect(expression).toBe('artist:match AND title:match');
        });

        test('should migrate similarity threshold filters', () => {
            const legacyFilter = '(item) => item.matching.artist.match && (item.matching.title.similarity ?? 0) >= 0.8';
            const expression = migrateLegacyFilter(legacyFilter);
            expect(expression).toBe('artist:match AND title:similarity>=0.8');
        });

        test('should migrate three-condition filters', () => {
            const legacyFilter = '(item) => item.matching.artist.contains && item.matching.title.contains && item.matching.album.contains';
            const expression = migrateLegacyFilter(legacyFilter);
            expect(expression).toBe('artist:contains AND title:contains AND album:contains');
        });

        test('should handle artistWithTitle fields correctly', () => {
            const legacyFilter = '(item) => (item.matching.artistWithTitle.similarity ?? 0) >= 0.95';
            const expression = migrateLegacyFilter(legacyFilter);
            expect(expression).toBe('artistWithTitle:similarity>=0.95');
        });
    });

    describe('All 13 default rule migrations', () => {
        LEGACY_FILTERS.forEach((filter, index) => {
            test(`should migrate rule ${index + 1}: ${filter.reason}`, () => {
                const expression = migrateLegacyFilter(filter.filter);
                expect(expression).toBe(EXPECTED_EXPRESSIONS[index]);
            });
        });
    });

    describe('Migration edge cases', () => {
        test('should handle whitespace variations in legacy filters', () => {
            const variations = [
                '(item) => item.matching.artist.match && item.matching.title.match',
                '(item)=>item.matching.artist.match&&item.matching.title.match',
                '(item) =>  item.matching.artist.match  &&  item.matching.title.match',
                '\n(item) => \n  item.matching.artist.match \n  && \n  item.matching.title.match\n'
            ];

            variations.forEach(filter => {
                const expression = migrateLegacyFilter(filter);
                expect(expression).toBe('artist:match AND title:match');
            });
        });

        test('should handle different nullish coalescing patterns', () => {
            const variations = [
                '(item.matching.title.similarity ?? 0) >= 0.8',
                '(item.matching.title.similarity||0)>=0.8',
                '(item.matching.title.similarity || 0) >= 0.8'
            ];

            variations.forEach(pattern => {
                const legacyFilter = `(item) => item.matching.artist.match && ${pattern}`;
                const expression = migrateLegacyFilter(legacyFilter);
                expect(expression).toBe('artist:match AND title:similarity>=0.8');
            });
        });

        test('should handle malformed legacy filters gracefully', () => {
            const malformedFilters = [
                '',
                '(item) =>',
                '(item) => invalid.syntax',
                '(item) => item.matching.artist.match &&',
                'not a function at all'
            ];

            malformedFilters.forEach(filter => {
                expect(() => migrateLegacyFilter(filter)).not.toThrow();
                const expression = migrateLegacyFilter(filter);
                expect(typeof expression).toBe('string');
            });
        });
    });
});

describe('Migration Tests - Functionality Preservation', () => {
    // Test data scenarios covering various matching patterns
    const testScenarios = [
        {
            name: 'Perfect matches',
            track: createMockTrack({
                artist: { match: true, contains: true, similarity: 1.0 },
                title: { match: true, contains: true, similarity: 1.0 },
                album: { match: true, contains: true, similarity: 1.0 },
                artistWithTitle: { match: true, contains: true, similarity: 1.0 }
            })
        },
        {
            name: 'Partial matches',
            track: createMockTrack({
                artist: { match: false, contains: true, similarity: 0.8 },
                title: { match: false, contains: true, similarity: 0.75 },
                album: { match: false, contains: true, similarity: 0.6 },
                artistWithTitle: { match: false, contains: true, similarity: 0.85 }
            })
        },
        {
            name: 'High similarity scores',
            track: createMockTrack({
                artist: { match: false, contains: false, similarity: 0.9 },
                title: { match: false, contains: false, similarity: 0.95 },
                album: { match: false, contains: false, similarity: 0.88 },
                artistWithTitle: { match: false, contains: false, similarity: 0.96 }
            })
        },
        {
            name: 'Low similarity scores',
            track: createMockTrack({
                artist: { match: false, contains: false, similarity: 0.3 },
                title: { match: false, contains: false, similarity: 0.25 },
                album: { match: false, contains: false, similarity: 0.1 },
                artistWithTitle: { match: false, contains: false, similarity: 0.2 }
            })
        },
        {
            name: 'Mixed matching patterns',
            track: createMockTrack({
                artist: { match: true, contains: true, similarity: 0.7 },
                title: { match: false, contains: true, similarity: 0.85 },
                album: { match: true, contains: false, similarity: 0.6 },
                artistWithTitle: { match: false, contains: false, similarity: 0.8 }
            })
        }
    ];

    describe('Legacy vs Expression result comparison', () => {
        LEGACY_FILTERS.forEach((filter, filterIndex) => {
            describe(`Filter ${filterIndex + 1}: ${filter.reason}`, () => {
                const legacyFunction = compileLegacyFunction(filter.filter);
                const expression = EXPECTED_EXPRESSIONS[filterIndex];
                const expressionFunction = parseExpression(expression);

                testScenarios.forEach((scenario, scenarioIndex) => {
                    test(`should produce same result for scenario ${scenarioIndex + 1}: ${scenario.name}`, () => {
                        const legacyResult = legacyFunction(scenario.track);
                        const expressionResult = expressionFunction(scenario.track);
                        
                        expect(expressionResult).toBe(legacyResult);
                    });
                });
            });
        });
    });

    describe('Batch migration testing', () => {
        test('should migrate all 13 rules successfully', () => {
            const migratedExpressions = LEGACY_FILTERS.map(filter => 
                migrateLegacyFilter(filter.filter)
            );

            expect(migratedExpressions).toHaveLength(13);
            migratedExpressions.forEach((expression, index) => {
                expect(expression).toBe(EXPECTED_EXPRESSIONS[index]);
            });
        });

        test('all migrated expressions should be valid', () => {
            const migratedExpressions = LEGACY_FILTERS.map(filter => 
                migrateLegacyFilter(filter.filter)
            );

            migratedExpressions.forEach(expression => {
                expect(() => parseExpression(expression)).not.toThrow();
                const fn = parseExpression(expression);
                expect(typeof fn).toBe('function');
            });
        });
    });

    describe('Performance comparison', () => {
        test('migrated expressions should be at least as fast as legacy functions', () => {
            const testTrack = testScenarios[2].track; // High similarity scenario
            
            // Test legacy performance
            const legacyFunctions = LEGACY_FILTERS.map(filter => 
                compileLegacyFunction(filter.filter)
            );
            
            const legacyStart = performance.now();
            for (let i = 0; i < 1000; i++) {
                legacyFunctions.forEach(fn => fn(testTrack));
            }
            const legacyDuration = performance.now() - legacyStart;

            // Test expression performance
            const expressionFunctions = EXPECTED_EXPRESSIONS.map(expr => 
                parseExpression(expr)
            );
            
            const expressionStart = performance.now();
            for (let i = 0; i < 1000; i++) {
                expressionFunctions.forEach(fn => fn(testTrack));
            }
            const expressionDuration = performance.now() - expressionStart;

            // New implementation should be comparable or faster
            expect(expressionDuration).toBeLessThanOrEqual(legacyDuration * 1.5); // Allow 50% tolerance
        });
    });
});

describe('Migration Tests - Backward Compatibility', () => {
    describe('Configuration format support', () => {
        test('should support reading legacy configuration format', () => {
            const legacyConfig = {
                reason: 'Test filter',
                filter: '(item) => item.matching.artist.match && item.matching.title.match'
            };

            expect(() => migrateLegacyFilter(legacyConfig.filter)).not.toThrow();
            const expression = migrateLegacyFilter(legacyConfig.filter);
            expect(expression).toBe('artist:match AND title:match');
        });

        test('should support mixed legacy and new format configurations', () => {
            const mixedConfig = [
                { reason: 'Legacy', filter: '(item) => item.matching.artist.match' },
                { reason: 'New', expression: 'artist:match' }
            ];

            // Should handle both formats gracefully
            mixedConfig.forEach(config => {
                if ('filter' in config) {
                    const expression = migrateLegacyFilter(config.filter);
                    expect(expression).toBe('artist:match');
                }
                if ('expression' in config) {
                    const fn = parseExpression(config.expression);
                    expect(typeof fn).toBe('function');
                }
            });
        });
    });

    describe('API compatibility', () => {
        test('migration should not break existing configuration loading', () => {
            // Simulate loading configuration that might contain legacy filters
            const configData = {
                matchFilters: LEGACY_FILTERS.slice(0, 3) // First 3 filters
            };

            const migratedFilters = configData.matchFilters.map(filter => ({
                reason: filter.reason,
                expression: migrateLegacyFilter(filter.filter)
            }));

            expect(migratedFilters).toHaveLength(3);
            migratedFilters.forEach((filter, index) => {
                expect(filter.reason).toBe(configData.matchFilters[index].reason);
                expect(filter.expression).toBe(EXPECTED_EXPRESSIONS[index]);
            });
        });

        test('should handle configuration with both legacy and new formats', () => {
            const hybridConfig = {
                matchFilters: [
                    { reason: 'Legacy 1', filter: '(item) => item.matching.artist.match' },
                    { reason: 'New 1', expression: 'title:contains' },
                    { reason: 'Legacy 2', filter: '(item) => item.matching.album.match' }
                ]
            };

            const processedFilters = hybridConfig.matchFilters.map(filter => {
                if ('filter' in filter && filter.filter) {
                    return {
                        reason: filter.reason,
                        expression: migrateLegacyFilter(filter.filter)
                    };
                } else if ('expression' in filter) {
                    return filter;
                }
                throw new Error('Invalid filter format');
            });

            expect(processedFilters).toHaveLength(3);
            expect(processedFilters[0].expression).toBe('artist:match');
            expect(processedFilters[1].expression).toBe('title:contains');
            expect(processedFilters[2].expression).toBe('album:match');
        });
    });

    describe('Error handling during migration', () => {
        test('should handle migration errors gracefully', () => {
            const problematicFilters = [
                '',
                'invalid javascript',
                '(item) => throw new Error("test")',
                '(item) => undefined.property.access'
            ];

            problematicFilters.forEach(filter => {
                expect(() => migrateLegacyFilter(filter)).not.toThrow();
                const result = migrateLegacyFilter(filter);
                // Should return a safe default or indicate failure
                expect(typeof result).toBe('string');
            });
        });

        test('should provide fallback for unmigrable filters', () => {
            const complexFilter = '(item) => { const x = item.matching.artist.similarity; return x > 0.5 ? true : false; }';
            
            const result = migrateLegacyFilter(complexFilter);
            expect(typeof result).toBe('string');
            // Should either migrate successfully or provide a safe fallback
        });
    });
});

describe('Migration Tests - Rule Analysis', () => {
    describe('Pattern frequency analysis', () => {
        test('should identify most common patterns in legacy rules', () => {
            const patterns = {
                artistMatch: 0,
                artistContains: 0,
                artistSimilarity: 0,
                titleMatch: 0,
                titleContains: 0,
                titleSimilarity: 0,
                albumMatch: 0,
                albumContains: 0,
                artistWithTitle: 0
            };

            LEGACY_FILTERS.forEach(filter => {
                if (filter.filter.includes('artist.match')) patterns.artistMatch++;
                if (filter.filter.includes('artist.contains')) patterns.artistContains++;
                if (filter.filter.includes('artist.similarity')) patterns.artistSimilarity++;
                if (filter.filter.includes('title.match')) patterns.titleMatch++;
                if (filter.filter.includes('title.contains')) patterns.titleContains++;
                if (filter.filter.includes('title.similarity')) patterns.titleSimilarity++;
                if (filter.filter.includes('album.match')) patterns.albumMatch++;
                if (filter.filter.includes('album.contains')) patterns.albumContains++;
                if (filter.filter.includes('artistWithTitle')) patterns.artistWithTitle++;
            });

            // Verify expected pattern distribution
            expect(patterns.artistMatch).toBeGreaterThan(0);
            expect(patterns.titleMatch).toBeGreaterThan(0);
            expect(patterns.artistContains).toBeGreaterThan(0);
            expect(patterns.titleSimilarity).toBeGreaterThan(0);
            
            console.log('Pattern analysis:', patterns);
        });

        test('should identify similarity threshold distribution', () => {
            const thresholds = new Set<number>();
            
            LEGACY_FILTERS.forEach(filter => {
                const matches = filter.filter.match(/>=\s*(\d+\.?\d*)/g);
                if (matches) {
                    matches.forEach(match => {
                        const threshold = parseFloat(match.replace('>=', '').trim());
                        thresholds.add(threshold);
                    });
                }
            });

            const thresholdArray = Array.from(thresholds).sort();
            console.log('Similarity thresholds used:', thresholdArray);
            
            // Should have common thresholds like 0.7, 0.8, 0.85, 0.9, 0.95
            expect(thresholdArray.length).toBeGreaterThan(0);
        });
    });
});