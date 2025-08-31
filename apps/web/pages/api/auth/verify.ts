import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import { GetPlexPinResponse } from '@/types/GetPlexPinResponse';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (_req, res, _next) => {
            try {
                const settings = await plex.getSettings();
                
                if (!settings.pin_id || !settings.pin_code) {
                    return res.status(400).json({ error: 'No authentication pin found' });
                }

                const result = await axios.get<GetPlexPinResponse>(`https://plex.tv/api/v2/pins/${settings.pin_id}`, {
                    params: {
                        code: settings.pin_code,
                        "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
                    }
                })

                await plex.updateSettings({ token: result.data.authToken })
                res.json({
                    ok: true
                })
            } catch (error) {
                console.error('Error verifying Plex authentication:', error);
                res.status(500).json({ error: 'Failed to verify authentication' });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Plex Authentication", err);
    },
});


