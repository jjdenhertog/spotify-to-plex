import { generateError } from '@/helpers/errors/generateError';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            const redirectUri = process.env.SPOTIFY_API_REDIRECT_URI;
            const clientId = process.env.SPOTIFY_API_CLIENT_ID;

            if (!redirectUri)
                throw new Error(`Missing environment variables: SPOTIFY_API_REDIRECT_URI`)

            if (!clientId)
                throw new Error(`Missing environment variables: SPOTIFY_API_CLIENT_ID`)

            const scopes = [
                'user-read-recently-played',
                'user-library-read',
                'playlist-read-private',
                'playlist-read-collaborative',
                'user-read-playback-state'
            ].join(' ')

            const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

            return res.redirect(302, authUrl);
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Spotify import", err);
    },
});


