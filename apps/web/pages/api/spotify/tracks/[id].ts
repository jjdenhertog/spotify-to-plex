import { generateError } from '@/helpers/errors/generateError';
import { Track } from '@spotify-to-plex/shared-types/spotify/Track';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetSpotifyTrackByIdResponse = Track

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {
            const { id } = req.query;

            if (typeof id !== 'string')
                return res.status(400).json({ error: "Track ID missing" })

            if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                return res.status(400).json({ error: "Spotify Credentials missing. Please add the environment variables to use this feature." })

            // Extract track ID from Spotify URI if needed
            const trackId = id.startsWith('spotify:track:')
                ? id.replace('spotify:track:', '')
                : id;

            try {
                const api = SpotifyApi.withClientCredentials(process.env.SPOTIFY_API_CLIENT_ID, process.env.SPOTIFY_API_CLIENT_SECRET);
                const data = await api.tracks.get(trackId)

                if (!data)
                    return res.status(404).json({ error: "Track not found" })

                const result: Track = {
                    id: data.id,
                    title: data.name,
                    artists: data.artists.map(item => item.name),
                    album: data.album.name,
                    album_id: data.album?.id || 'unknown'
                }

                res.status(200).json(result)
            } catch (error: any) {
                if (error.status === 404) {
                    return res.status(404).json({ error: "Track not found" })
                }

                throw error;
            }
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Spotify track by ID", err);
    },
});