import { generateError } from '@/helpers/errors/generateError';
import { SyncLog } from '@spotify-to-plex/shared-types/common/sync';
import { settingsDir } from '@spotify-to-plex/shared-utils/utils/settingsDir';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(async (_req, res) => {
        try {
            // Get settings directory - matching sync-worker's approach
            const logsPath = join(settingsDir, 'sync_log.json');
            
            // Return empty array if file doesn't exist (graceful handling)
            if (!existsSync(logsPath)) {
                return res.json([]);
            }
            
            // Read and parse the logs file
            const logsContent = readFileSync(logsPath, 'utf8');
            let logs: SyncLog[] = JSON.parse(logsContent);
            
            // Apply same rotation logic as getSyncLogs for consistency
            // Keep only last 100 entries and remove logs older than 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            logs = logs
                .filter(log => log.start > thirtyDaysAgo)
                .slice(-100)
                .reverse(); // Most recent first for better UX
            
            res.json(logs);
        } catch (error) {
            console.error('Error reading sync logs:', error);
            res.status(500).json({ error: 'Failed to read sync logs' });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Logs", err);
    }
});