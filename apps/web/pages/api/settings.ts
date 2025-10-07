import { generateError } from '@/helpers/errors/generateError';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';
import { updateSettings } from '@spotify-to-plex/plex-config/functions/updateSettings';
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
                if (req.body.uri) 
                    await updateSettings({ uri: req.body.uri, id: req.body.id })

                const settings = await getSettings();
                res.json({ loggedin: !!settings.token, uri: settings.uri, id: settings.id })
            } catch (error) {
                console.error('Error updating Plex settings:', error);
                res.status(500).json({ error: 'Failed to update settings' });
            }
        })
    .get(
        async (_req, res) => {
            try {
                const settings = await getSettings();
                res.json({ loggedin: !!settings.token, uri: settings.uri, id: settings.id })
            } catch (error) {
                console.error('Error getting Plex settings:', error);
                res.json({ loggedin: false })
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});

