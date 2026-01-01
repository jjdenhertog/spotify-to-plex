import { generateError } from '@/helpers/errors/generateError';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {
            const redirectUri = process.env.SPOTIFY_API_REDIRECT_URI;
            const clientId = process.env.SPOTIFY_API_CLIENT_ID;

            if (!redirectUri)
                throw new Error(`Missing environment variables: SPOTIFY_API_REDIRECT_URI`)

            if (!clientId)
                throw new Error(`Missing environment variables: SPOTIFY_API_CLIENT_ID`)

            // Build the local return URL from request headers
            const { host } = req.headers;
            const forwardedProto = req.headers['x-forwarded-proto'];
            const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || 'http';
            const localTokenUrl = `${protocol}://${host || 'localhost'}/api/spotify/token`;

            // Create state with local return URL
            const state = Buffer.from(JSON.stringify({
                return_url: localTokenUrl
            })).toString('base64');

            const scopes = [
                'user-read-recently-played',
                'user-library-read',
                'playlist-read-private',
                'playlist-read-collaborative',
                'user-read-playback-state'
            ].join(' ')

            const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

            return res.redirect(302, authUrl);
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Spotify import", err);
    },
});


