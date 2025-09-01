#!/usr/bin/env ts-node

// Test script to validate migration accuracy against all 13 default rules
import { MatchFilterConfig } from './packages/music-search/src/types/MatchFilterConfig';
import { migrateLegacyFilterFast, getMigrationStats } from './packages/music-search/src/functions/migrateLegacyFilter';

console.log('🧪 Testing Legacy Filter Migration');
console.log('==================================\n');

// Create test data with the original 13 legacy filter functions
const LEGACY_TEST_FILTERS: MatchFilterConfig[] = [
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

// Test migration of all 13 default rules
const results = LEGACY_TEST_FILTERS.map((config, index) => {
  console.log(`Test ${index + 1}/13: ${config.reason}`);
  console.log(`Input:  ${config.filter}`);
  
  const result = migrateLegacyFilterFast(config);
  
  if (result.success) {
    console.log(`Output: ${result.config!.expression}`);
    console.log('✅ SUCCESS\n');
  } else {
    console.log(`❌ FAILED: ${result.error}`);
    if (result.originalFunction) {
      console.log(`Original: ${result.originalFunction}`);
    }
    console.log('');
  }
  
  return result;
});

// Generate statistics
const stats = getMigrationStats(results);

console.log('\n📊 Migration Statistics');
console.log('======================');
console.log(`Total rules tested: ${stats.total}`);
console.log(`Successfully migrated: ${stats.successful}`);
console.log(`Failed migrations: ${stats.failed}`);
console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);

if (stats.errors.length > 0) {
  console.log('\n❌ Errors:');
  stats.errors.forEach(error => {
    console.log(`  - ${error.reason}: ${error.error}`);
  });
}

// Check if we achieved our target
if (stats.successRate >= 95) {
  console.log('\n🎉 SUCCESS: Achieved 95%+ migration success rate!');
} else {
  console.log(`\n⚠️  WARNING: Only achieved ${stats.successRate.toFixed(1)}% success rate (target: 95%)`);
}

console.log('\n✨ Migration test completed');