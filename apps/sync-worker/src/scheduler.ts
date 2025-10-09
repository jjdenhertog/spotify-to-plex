import { schedule } from 'node-cron';
import { spawn } from 'node:child_process';

const SYNC_SCHEDULE = '0 12 * * *'; // cron format: minute hour day month weekday

console.log('🚀 Sync scheduler started');
console.log(`⏰ Scheduled to run daily at 12:00 PM (schedule: ${SYNC_SCHEDULE})`);

// Function to run the sync command
function runSync() {
    console.log(`\n📅 Starting scheduled sync at ${new Date().toISOString()}`);

    // In production, the sync script already uses compiled JS files
    const syncProcess = spawn('npm', ['run', 'sync'], {
        cwd: '/app/apps/sync-worker',
        stdio: 'inherit',
        shell: true
    });

    syncProcess.on('exit', (code) => {
        if (code === 0) {
            console.log(`✅ Sync completed successfully at ${new Date().toISOString()}`);
        } else {
            console.error(`❌ Sync failed with exit code ${code} at ${new Date().toISOString()}`);
        }
    });

    syncProcess.on('error', (error) => {
        console.error(`❌ Failed to start sync process:`, error);
    });
}

// Schedule the sync task
const task = schedule(SYNC_SCHEDULE, runSync, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC' // Use TZ env var or default to UTC
});

// Run sync immediately on startup if SYNC_ON_STARTUP env var is set
if (process.env.SYNC_ON_STARTUP === 'true') {
    console.log('🔄 Running initial sync on startup...');
    runSync();
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, stopping scheduler...');
    task.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, stopping scheduler...');
    task.stop();
    process.exit(0);
});

// Keep the process alive
process.stdin.resume();