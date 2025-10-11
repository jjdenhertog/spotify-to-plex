import { generateError } from '@/helpers/errors/generateError';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { SyncTypeLogCollection, SyncLogCollection } from '@spotify-to-plex/shared-types/common/sync';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { join } from 'path';

export type GetLogsResponse = {
    sync_type_log: SyncTypeLogCollection;
    sync_log: SyncLogCollection;
    lidarr_sync_log: Record<string, any>;
    missing_files: {
        missing_tracks_spotify: string;
        missing_tracks_tidal: string;
        missing_albums_spotify: string;
        missing_albums_tidal: string;
        missing_tracks_lidarr: string;
        missing_albums_lidarr: string;
    };
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            try {
                const storageDir = getStorageDir();

                // Read sync_type_log.json with fallback
                let syncTypeLog: SyncTypeLogCollection = {
                    users: undefined,
                    albums: undefined,
                    playlists: undefined,
                    lidarr: undefined,
                    mqtt: undefined
                };
                const syncTypeLogPath = join(storageDir, 'sync_type_log.json');
                if (existsSync(syncTypeLogPath)) {
                    try {
                        const content = readFileSync(syncTypeLogPath, 'utf-8');
                        syncTypeLog = JSON.parse(content);
                    } catch (error) {
                        console.error('Error parsing sync_type_log.json:', error);
                    }
                }

                // Read sync_log.json with fallback
                let syncLog: SyncLogCollection = {
                    users: [],
                    albums: [],
                    playlists: [],
                    lidarr: [],
                    mqtt: []
                };
                const syncLogPath = join(storageDir, 'sync_log.json');
                if (existsSync(syncLogPath)) {
                    try {
                        const content = readFileSync(syncLogPath, 'utf-8');
                        syncLog = JSON.parse(content);
                    } catch (error) {
                        console.error('Error parsing sync_log.json:', error);
                    }
                }

                // Read lidarr_sync_log.json with fallback
                let lidarrSyncLog = {};
                const lidarrSyncLogPath = join(storageDir, 'lidarr_sync_log.json');
                if (existsSync(lidarrSyncLogPath)) {
                    try {
                        const content = readFileSync(lidarrSyncLogPath, 'utf-8');
                        lidarrSyncLog = JSON.parse(content);
                    } catch (error) {
                        console.error('Error parsing lidarr_sync_log.json:', error);
                    }
                }

                // Read all missing files
                const readMissingFile = (filename: string): string => {
                    const filePath = join(storageDir, filename);
                    if (existsSync(filePath)) {
                        try {
                            return readFileSync(filePath, 'utf-8');
                        } catch (error) {
                            console.error(`Error reading ${filename}:`, error);
                            return '';
                        }
                    }
                    return '';
                };

                const readMissingJsonFile = (filename: string): string => {
                    const filePath = join(storageDir, filename);
                    if (existsSync(filePath)) {
                        try {
                            const content = readFileSync(filePath, 'utf-8');
                            return JSON.stringify(JSON.parse(content), null, 2);
                        } catch (error) {
                            console.error(`Error reading ${filename}:`, error);
                            return '';
                        }
                    }
                    return '';
                };

                const response: GetLogsResponse = {
                    sync_type_log: syncTypeLog,
                    sync_log: syncLog,
                    lidarr_sync_log: lidarrSyncLog,
                    missing_files: {
                        missing_tracks_spotify: readMissingFile('missing_tracks_spotify.txt'),
                        missing_tracks_tidal: readMissingFile('missing_tracks_tidal.txt'),
                        missing_albums_spotify: readMissingFile('missing_albums_spotify.txt'),
                        missing_albums_tidal: readMissingFile('missing_albums_tidal.txt'),
                        missing_tracks_lidarr: readMissingJsonFile('missing_tracks_lidarr.json'),
                        missing_albums_lidarr: readMissingJsonFile('missing_albums_lidarr.json'),
                    }
                };

                res.status(200).json(response);
            } catch (error) {
                console.error('Error fetching logs:', error);
                res.status(500).json({ error: 'Failed to fetch logs' });
            }
        })
    .delete(
        async (_req, res) => {
            try {
                const storageDir = getStorageDir();
                const syncTypeLogPath = join(storageDir, 'sync_type_log.json');
                const syncLogPath = join(storageDir, 'sync_log.json');
                const lidarrSyncLogPath = join(storageDir, 'lidarr_sync_log.json');

                // Delete sync_type_log.json if it exists
                if (existsSync(syncTypeLogPath)) {
                    unlinkSync(syncTypeLogPath);
                }

                // Delete sync_log.json if it exists
                if (existsSync(syncLogPath)) {
                    unlinkSync(syncLogPath);
                }

                // Delete lidarr_sync_log.json if it exists
                if (existsSync(lidarrSyncLogPath)) {
                    unlinkSync(lidarrSyncLogPath);
                }

                res.status(200).json({ message: 'Logs cleared successfully' });
            } catch (error) {
                console.error('Error clearing logs:', error);
                res.status(500).json({ error: 'Failed to clear logs' });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Logs", err);
    }
});