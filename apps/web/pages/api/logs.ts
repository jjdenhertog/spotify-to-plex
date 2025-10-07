import { generateError } from '@/helpers/errors/generateError';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { readFileSync, existsSync } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { join } from 'path';

export type GetLogsResponse = {
    sync_log: Record<string, any>;
    missing_tracks_spotify: string;
    missing_tracks_tidal: string;
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            try {
                const storageDir = getStorageDir();

                // Read sync_log.json with fallback to empty object
                let syncLog = {};
                const syncLogPath = join(storageDir, 'sync_log.json');
                if (existsSync(syncLogPath)) {
                    try {
                        const content = readFileSync(syncLogPath, 'utf-8');
                        syncLog = JSON.parse(content);
                    } catch (error) {
                        console.error('Error parsing sync_log.json:', error);
                        syncLog = {};
                    }
                }

                // Read missing_tracks_spotify.txt with fallback to empty string
                let missingTracksSpotify = '';
                const missingTracksSpotifyPath = join(storageDir, 'missing_tracks_spotify.txt');
                if (existsSync(missingTracksSpotifyPath)) {
                    try {
                        missingTracksSpotify = readFileSync(missingTracksSpotifyPath, 'utf-8');
                    } catch (error) {
                        console.error('Error reading missing_tracks_spotify.txt:', error);
                        missingTracksSpotify = '';
                    }
                }

                // Read missing_tracks_tidal.txt with fallback to empty string
                let missingTracksTidal = '';
                const missingTracksTidalPath = join(storageDir, 'missing_tracks_tidal.txt');
                if (existsSync(missingTracksTidalPath)) {
                    try {
                        missingTracksTidal = readFileSync(missingTracksTidalPath, 'utf-8');
                    } catch (error) {
                        console.error('Error reading missing_tracks_tidal.txt:', error);
                        missingTracksTidal = '';
                    }
                }

                const response: GetLogsResponse = {
                    sync_log: syncLog,
                    missing_tracks_spotify: missingTracksSpotify,
                    missing_tracks_tidal: missingTracksTidal
                };

                res.status(200).json(response);
            } catch (error) {
                console.error('Error fetching logs:', error);
                res.status(500).json({ error: 'Failed to fetch logs' });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Logs", err);
    }
});