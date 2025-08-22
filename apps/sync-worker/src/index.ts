#!/usr/bin/env node

/**
 * Sync Worker - Background sync worker for Spotify-to-Plex synchronization tasks
 * 
 * This is the main entry point for the sync worker application.
 * It provides a CLI interface to run different sync jobs.
 */

import { syncAlbums } from './jobs/albums';
import { refreshMQTT } from './jobs/mqtt';
import { syncPlaylists } from './jobs/playlists';
import { syncUsers } from './jobs/users';

const SYNC_JOBS = {
  albums: syncAlbums,
  mqtt: refreshMQTT,
  playlists: syncPlaylists,
  users: syncUsers,
} as const;

type SyncJobType = keyof typeof SYNC_JOBS;

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Sync Worker - Spotify-to-Plex Background Synchronization

Usage: sync-worker <job-type> [options]

Job Types:
  albums     - Sync Spotify albums to Plex
  playlists  - Sync Spotify playlists to Plex
  users      - Sync user data and recent activity
  mqtt       - Publish MQTT messages for Home Assistant

Options:
  --force    - Force sync regardless of interval settings
  --help     - Show this help message

Examples:
  sync-worker playlists
  sync-worker albums --force
  sync-worker mqtt
  sync-worker users
`);
}

/**
 * Run the specified sync job
 */
async function runSyncJob(jobType: SyncJobType) {
  const job = SYNC_JOBS[jobType];
  if (!job) {
    console.error(`Unknown job type: ${jobType}`);
    process.exit(1);
  }

  console.log(`Starting ${jobType} sync job...`);
  
  try {
    await job();
    console.log(`${jobType} sync job completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`${jobType} sync job failed:`, error);
    process.exit(1);
  }
}

/**
 * Main CLI entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const jobType = args[0] as SyncJobType;
  
  if (!Object.keys(SYNC_JOBS).includes(jobType)) {
    console.error(`Invalid job type: ${jobType}`);
    console.error(`Valid job types: ${Object.keys(SYNC_JOBS).join(', ')}`);
    process.exit(1);
  }

  runSyncJob(jobType);
}

// Export functions for programmatic use

export type { SyncJobType };

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

export {syncAlbums} from './jobs/albums';
export {refreshMQTT} from './jobs/mqtt';
export {syncPlaylists} from './jobs/playlists';
export {syncUsers} from './jobs/users';