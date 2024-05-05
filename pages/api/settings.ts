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
        async (req, res, next) => {
            if (req.body.uri)
                plex.saveConfig({ uri: req.body.uri, id: req.body.id })

            res.json({ loggedin: !!plex.settings.token, uri: plex.settings.uri, id: plex.settings.id })
        })
    .get(
        async (req, res, next) => {
            res.json({ loggedin: !!plex.settings.token, uri: plex.settings.uri, id: plex.settings.id })
        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


