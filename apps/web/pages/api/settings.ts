import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetSettingsResponse = {
    loggedin: boolean
    uri?: string,
    id?: string,
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                if (req.body.uri) {
                    await plex.updateSettings({ uri: req.body.uri, id: req.body.id })
                }

                const settings = await plex.getSettings();
                res.json({ loggedin: !!settings.token, uri: settings.uri, id: settings.id })
            } catch (_error) {
                                // Error updating Plex settings - handled by Next.js error boundary
                res.status(500).json({ error: 'Failed to update settings' });
            }
        })
    .get(
        async (_req, res) => {
            try {
                const settings = await plex.getSettings();
                res.json({ loggedin: !!settings.token, uri: settings.uri, id: settings.id })
            } catch (_error) {
                                // Error getting Plex settings - handled by Next.js error boundary
                res.status(500).json({ error: 'Failed to get settings' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});


