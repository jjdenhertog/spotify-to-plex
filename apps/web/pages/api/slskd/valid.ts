import { generateError } from '@/helpers/errors/generateError';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            if (typeof process.env.SLSKD_API_KEY !== 'string')
                return res.json({ ok: false })

            return res.json({ ok: true })
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Valid", err);
    },
});
