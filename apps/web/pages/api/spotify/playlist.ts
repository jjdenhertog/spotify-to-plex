import { generateError } from '@/helpers/errors/generateError';
import { getAccessToken } from '@spotify-to-plex/shared-utils/spotify/getAccessToken';
import { getSpotifyData } from '@spotify-to-plex/shared-utils/spotify/getSpotifyData';
import { toSpotifyUri } from '@spotify-to-plex/shared-utils/spotify/toSpotifyUri';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const { url } = req.query
            if (typeof url !== 'string')
                return res.status(400).json({ error: "url missing" })

            const uri = toSpotifyUri(url)
            if (!uri)
                return res.status(400).json({ error: "Not a Spotify link. Expected an open.spotify.com link or a spotify:playlist:<id> URI" })

            if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                return res.status(400).json({ error: "Spotify Credentials missing. Please add the environment variables to use this feature." })

            // The first connected user with a valid token: client credentials no longer get playlist tracks.
            const accessToken = await getAccessToken()
            let api = SpotifyApi.withClientCredentials(process.env.SPOTIFY_API_CLIENT_ID, process.env.SPOTIFY_API_CLIENT_SECRET);
            if (accessToken)
                api = SpotifyApi.withAccessToken(process.env.SPOTIFY_API_CLIENT_ID, accessToken)

            const data = await getSpotifyData(api, uri, false)
            if (!data)
                return res.status(400).json({ error: "Spotify did not release this playlist: it is private, or a Spotify-made mix (SpotifyScraper needed)" })

            return res.json(data)
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Spotify playlist", err);
    },
});
