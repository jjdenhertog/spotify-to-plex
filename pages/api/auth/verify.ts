import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import { GetPlexPinResponse } from '@/types/PlexAPI';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (_req, res, _next) => {
            const result = await axios.get<GetPlexPinResponse>(`https://plex.tv/api/v2/pins/${plex.settings.pin_id}`, {
                params: {
                    code: plex.settings.pin_code,
                    "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
                }
            })

            plex.saveConfig({ token: result.data.authToken })
            res.json({
                ok: true
            })
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Plex Authentication", err);
    },
});


