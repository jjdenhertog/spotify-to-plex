import { generateError } from '@/helpers/errors/generateError';
import { setManualTrackLink } from '@spotify-to-plex/shared-utils/cache/setManualTrackLink';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            const { spotifyId, plexId } = req.body;

            if (typeof spotifyId !== 'string' || !spotifyId.trim() || typeof plexId !== 'string' || !plexId.trim())
                return res.status(400).json({ error: "Missing spotifyId or plexId" });

            try {
                setManualTrackLink(spotifyId, plexId);

                return res.json({ success: true });
            } catch (error) {
                console.error('Error caching manual match:', error);

                return res.status(500).json({ error: 'Failed to save the manual match' });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Cache manual match", err);
    }
});
