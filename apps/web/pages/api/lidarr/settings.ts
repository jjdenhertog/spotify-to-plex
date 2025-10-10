import { generateError } from '@/helpers/errors/generateError';
import { getLidarrSettings } from '@spotify-to-plex/plex-config/functions/getLidarrSettings';
import { updateLidarrSettings } from '@spotify-to-plex/plex-config/functions/updateLidarrSettings';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(async (_req, res) => {
        try {
            const settings = await getLidarrSettings();
            res.status(200).json(settings);
        } catch (error) {
            console.error('Error fetching Lidarr settings:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    })
    .put(async (req, res) => {
        try {
            const updates = req.body;
            const settings = await updateLidarrSettings(updates);
            res.status(200).json(settings);
        } catch (error) {
            console.error('Error updating Lidarr settings:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Lidarr Settings", err);
    }
});
