import { generateError } from '@/helpers/errors/generateError';
import { syncAlbums } from 'cronjob/albums';
import { syncPlaylists } from 'cronjob/playlists';
import { syncUsers } from 'cronjob/users';
import { syncLidarr } from 'cronjob/lidarr';
import { syncMQTT } from 'cronjob/mqtt';
import { syncSlskd } from 'cronjob/slskd';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {

            const { type } = req.query

            if (type !== 'albums' && type !== 'playlists' && type !== "users" && type !== "lidarr" && type !== "mqtt" && type !== "slskd" && type !== "all")
                throw new Error(`Expecting type albums, playlists, users, lidarr, mqtt, slskd, or all. Got ${typeof type === 'string' ? type : 'none'}`)

            // Fire and forget - start the sync process without awaiting
            if (type === 'all') {
                // Run all syncs in sequence but don't await
                syncUsers()
                    .then(() => syncAlbums())
                    .then(() => syncPlaylists())
                    .then(() => syncLidarr())
                    .then(() => syncMQTT())
                    .then(() => syncSlskd())
                    .catch((error: unknown) => {
                        console.error('Sync all failed:', error);
                    });
            } else {
                switch (type) {
                    case "albums":
                        syncAlbums().catch((error: unknown) => {
                            console.error('Sync albums failed:', error);
                        });
                        break;

                    case "playlists":
                        syncPlaylists().catch((error: unknown) => {
                            console.error('Sync playlists failed:', error);
                        });
                        break;

                    case "users":
                        syncUsers().catch((error: unknown) => {
                            console.error('Sync users failed:', error);
                        });
                        break;

                    case "lidarr":
                        syncLidarr().catch((error: unknown) => {
                            console.error('Sync lidarr failed:', error);
                        });
                        break;

                    case "mqtt":
                        syncMQTT().catch((error: unknown) => {
                            console.error('Sync mqtt failed:', error);
                        });
                        break;

                    case "slskd":
                        syncSlskd().catch((error: unknown) => {
                            console.error('Sync slskd failed:', error);
                        });
                        break;
                }
            }

            // Return immediately
            res.json({ ok: true, message: `Sync ${type} started` })
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});


