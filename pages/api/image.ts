import { AxiosRequest } from '@/helpers/AxiosRequest';
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
        async (req, res, next) => {
            const { path } = req.query;

            if (!path || Array.isArray(path) || !plex.settings.token)
                return res.status(400).end();

            try {
                res.setHeader(
                    "Cache-Control",
                    `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`,
                );
                const url = path.indexOf('http') > -1 ? path : `${plex.settings.uri}${path}`;
                try {

                    const data = await AxiosRequest.get<any>(url, plex.settings.token, { responseType: "arraybuffer" })
                    res.setHeader('content-type', String(data.headers['Content-Type']))
                    res.setHeader('content-length', data.data.length)
                    return res.status(200).send(data.data)

                } catch (e) {
                    console.log(e)
                }
                // const contentType = image.content_type
                // const body = image.image

                // res.setHeader("content-type", contentType);
                // return res.status(200).send(body)cate;
                return res.status(200).send('[ ]')
            } catch (error) {
                return res.status(404).end();
            }
        })

export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Image", err);
    },
});