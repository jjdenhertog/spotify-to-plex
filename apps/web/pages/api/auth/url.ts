import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import { PostPinResponse } from '@spotify-to-plex/shared-types/plex/PostPinResponse';
import axios from 'axios';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { stringify } from 'qs';


export type GetAuthUrlResponse = {
    authUrl: string
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res, _next) => {
            try {
                const result = await axios.post<PostPinResponse>("https://plex.tv/api/v2/pins", stringify({
                    strong: true,
                    "X-Plex-Product": "Spotify to Plex",
                    "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
                }))

                const authUrl =
                    `https://app.plex.tv/auth#?${stringify({
                        clientID: process.env.PLEX_APP_ID,
                        code: result.data.code,
                        forwardUrl: `${req.body.callback}?plex=1`,
                        context: {
                            device: {
                                product: 'Spotify to Plex',
                            },
                        },
                    })}`;

                await plex.updateSettings({ pin_id: `${result.data.id}`, pin_code: result.data.code })
                res.json({
                    authUrl
                })
            } catch (_error) {
                // Error handling - handled by Next.js error boundary
                res.status(500).json({ error: 'Failed to create authentication URL' });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {

        generateError(req, res, "Plex Authentication", err);
    },
});


