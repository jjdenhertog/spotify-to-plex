import { generateError } from '@/helpers/errors/generateError';
import { getSlskdSettings } from '@spotify-to-plex/plex-config/functions/getSlskdSettings';
import { updateSlskdSettings } from '@spotify-to-plex/plex-config/functions/updateSlskdSettings';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(async (_req, res) => {
        try {
            const settings = await getSlskdSettings();
            res.status(200).json(settings);
        } catch (error) {
            console.error('Error fetching SLSKD settings:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    })
    .put(async (req, res) => {
        try {
            const updates = req.body;
            const settings = await updateSlskdSettings(updates);
            res.status(200).json(settings);
        } catch (error) {
            console.error('Error updating SLSKD settings:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Settings", err);
    }
});
