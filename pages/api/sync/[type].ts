import { generateError } from '@/helpers/errors/generateError';
import { syncAlbums } from 'cronjob/albums';
import { syncPlaylists } from 'cronjob/playlists';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const { type } = req.query
            if (type != 'albums' && type != 'playlists')
                throw new Error(`Expecting type albums or playlists. Got ${typeof type == 'string' ? type : 'none'}`)

            switch (type) {
                case "albums":
                    await syncAlbums()
                    break;

                case "playlists":
                    await syncPlaylists()
                    break;
            }

            res.json({ ok: true })
        })


export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


