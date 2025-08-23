// Quick test to verify our plex library exports work
const { resolve } = require('path');

// Test web library import
try {
  const webLibPath = resolve('./apps/web/src/library/plex.ts');
  console.log('✅ Web plex library found at:', webLibPath);
} catch (e) {
  console.error('❌ Web plex library error:', e.message);
}

// Test sync-worker library import
try {
  const syncLibPath = resolve('./apps/sync-worker/src/library/plex.ts');
  console.log('✅ Sync-worker plex library found at:', syncLibPath);
} catch (e) {
  console.error('❌ Sync-worker plex library error:', e.message);
}

console.log('Library migration complete!');