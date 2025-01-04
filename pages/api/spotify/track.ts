import { generateError } from '@/helpers/errors/generateError';
import { Track } from '@/types/SpotifyAPI';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { parse } from 'node:url';

export type GetSpotifyTrackResponse = Track
const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            const { search } = req.body;

            if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                return res.status(400).json({ error: "Spotify Credentials missing. Please add the environment variables to use this feature." })

            let id = search || '';
            if (search) {
                if (search.indexOf('http') > -1) {
                    const { path } = parse(search, true);
                    if (path) {
                        id = path.split("/").join(":");
                        id = `spotify${id}`;
                    }
                } else if (search.split(":").length == 3) {
                    id = search;
                } else {
                    return res.status(400).json({ error: "Invalid Spotify URI, expecting spotify:playlist:id" })
                }
            }

            if (id.indexOf(':track:') == -1)
                return res.status(400).json({ error: "Invalid Spotify URI, expecting spotify:track:id" })

            const api = SpotifyApi.withClientCredentials(process.env.SPOTIFY_API_CLIENT_ID, process.env.SPOTIFY_API_CLIENT_SECRET);
            const trackId = id.slice(Math.max(0, id.indexOf('spotify:track:') + 'spotify:track:'.length)).trim();
            const data = await api.tracks.get(trackId)
            if (!data)
                return res.status(400).json({ error: "No data found, double check your Spotify Track URI" })


            const result: Track = {
                id: data.id,
                title: data.name,
                artists: data.artists.map(item => item.name),
                album: data.album.name
            }
            res.status(200).json(result)
        }
    )

export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Spotify tracks", err);
    },
});


