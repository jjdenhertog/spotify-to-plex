import { generateError } from '@/helpers/errors/generateError';
import getSpotifyData from '@/helpers/spotify/getSpotifyData';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { parse } from 'node:url';

export type GetSpotifyCollection = {
    id: string;
    name: string;
    image: string;
    tracks: {
        id: string;
        name: string;
        artist: string;
    }[]
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res, next) => {
            const input = req.body.search;
            if (typeof input != 'string')
                return res.status(400).json({ error: "Search query missing" })
            
            if(!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                return res.status(400).json({ error: "Spotify Credentials missing. Please add the environment variables to use this feature." })

            let id = '';
            if (input.indexOf('http') > -1) {
                const path = parse(input, true).path;
                if (path) {
                    id = path.split("/").join(":");
                    id = "spotify" + id;
                }
            } else if (input.split(":").length != 3) {
                return res.status(400).json({ error: "Invalid Spotify URI, expecting spotify:playlist:id" })
            } else {
                id = input;
            }

            const data = await getSpotifyData(id)
            if (!data)
                return res.status(400).json({ error: "No playlist found, it might be a private playlist"})

            return res.status(200).json(data)
        })

export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Spotify import", err);
    },
});


