import { generateError } from '@/helpers/errors/generateError';
import { setManualTrackLink } from '@spotify-to-plex/shared-utils/cache/setManualTrackLink';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            const { spotifyId, plexId } = req.body;

            if (typeof spotifyId !== 'string' || typeof plexId !== 'string')
                return res.status(400).json({ error: "Missing spotifyId or plexId" });

            setManualTrackLink(spotifyId, plexId);

            return res.json({ success: true });
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Cache manual match", err);
    }
});
