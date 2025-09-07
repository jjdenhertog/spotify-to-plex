import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
// MIGRATED: Updated to use http-client package
import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export const config = {
    api: {
        externalResolver: true,
    },
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {
            const { path } = req.query;

            if (!path || Array.isArray(path))
                return res.status(400).end();

            const settings = await plex.getSettings();

            if (!settings.token)
                return res.status(400).end();

            try {
                res.setHeader(
                    "Cache-Control",
                    `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
                );
                const url = path.indexOf('http') > -1 ? path : `${settings.uri}${path}`;
                try {

                    const data = await AxiosRequest.get<any>(url, settings.token, { responseType: "arraybuffer" })
                    const contentType = data.headers?.['Content-Type'];
                    res.setHeader('content-type', typeof contentType === 'string' ? contentType : 'image/jpeg')
                    res.setHeader('content-length', data.data.length)

                    return res.status(200).send(data.data)

                } catch (_e) {
                    // Debug log removed
                }

                return res.status(200).send('[ ]')
            } catch (_error) {
                return res.status(404).end();
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Image", err);
    },
});