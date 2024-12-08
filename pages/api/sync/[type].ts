import { generateError } from '@/helpers/errors/generateError';
import { syncAlbums } from 'cronjob/albums';
import { syncPlaylists } from 'cronjob/playlists';
import { syncUsers } from 'cronjob/users';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const { type } = req.query
            if (type != 'albums' && type != 'playlists' && type != "users")
                throw new Error(`Expecting type albums, playlists or users. Got ${typeof type == 'string' ? type : 'none'}`)

            switch (type) {
                case "albums":
                    await syncAlbums()
                    break;

                case "playlists":
                    await syncPlaylists()
                    break;

                case "users":
                    await syncUsers()
                    break;
            }

            res.json({ ok: true })
        })


export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


