import { generateError } from '@/helpers/errors/generateError';
import { getLidarrSettings } from '@spotify-to-plex/plex-config/functions/getLidarrSettings';
import { getStorageDir } from "@spotify-to-plex/shared-utils/utils/getStorageDir";
import { SpotifyCredentials } from '@spotify-to-plex/shared-types/spotify/SpotifyCredentials';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type SyncAvailability = {
    users: boolean;
    albums: boolean;
    playlists: boolean;
    lidarr: boolean;
    mqtt: boolean;
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(async (_req, res) => {
        try {
            // Check Users - at least one user with sync enabled
            let usersAvailable = false;
            const credentialsPath = join(getStorageDir(), 'spotify.json');
            if (existsSync(credentialsPath)) {
                const credentials: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'));
                usersAvailable = credentials.some(c => c.user?.sync === true);
            }

            // Check Lidarr - enabled in settings AND API key configured
            let lidarrAvailable = false;
            try {
                const lidarrSettings = await getLidarrSettings();
                lidarrAvailable = lidarrSettings.enabled === true && !!process.env.LIDARR_API_KEY;
            } catch {
                // Lidarr settings not configured
            }

            // Check MQTT - broker URL configured
            const mqttAvailable = !!process.env.MQTT_BROKER_URL;

            // Albums and playlists are always available (they don't require special setup)
            const availability: SyncAvailability = {
                users: usersAvailable,
                albums: true,
                playlists: true,
                lidarr: lidarrAvailable,
                mqtt: mqttAvailable
            };

            res.status(200).json(availability);
        } catch (error) {
            console.error('Error checking sync availability:', error);
            res.status(500).json({ error: 'Failed to check availability' });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Sync Availability", err);
    }
});
