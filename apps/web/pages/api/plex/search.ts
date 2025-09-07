import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                if (!req.body.query && !req.query.query)
                    return res.status(400).json({ message: "Please add a search query" });

                const settings = await plex.getSettings();

                if (!settings.uri || !settings.token)
                    return res.status(400).json({ message: "No Plex connection found" });

                // const response = await doHubSearch(req.body.query || req.query.query)
                return res.json({ ok: true })
            } catch (_error) {
                // Error performing Plex search - handled by Next.js error boundary

                return res.status(500).json({ message: "Something went wrong while connecting to this server." })
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Search", err);
    }
});


