import { generateError } from '@/helpers/errors/generateError';
import { getAccessToken } from '@spotify-to-plex/shared-utils/spotify/getAccessToken';
import { getSpotifyData } from '@spotify-to-plex/shared-utils/spotify/getSpotifyData';
import { settingsDir } from '@spotify-to-plex/shared-utils/utils/settingsDir';
import { SavedItem } from '@/types/SavedItem';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const { id } = req.query
            if (typeof id !== 'string')
                return res.status(400).json({ error: "ID missing" })

            if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                return res.status(400).json({ error: "Spotify Credentials missing. Please add the environment variables to use this feature." })

            const savedItemsPath = join(settingsDir, 'spotify_saved_items.json')
            if (!existsSync(savedItemsPath))
                return res.status(200).json([])

            const savedItems: SavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'))
            const savedItem = savedItems.find(item => item.id === id)
            if (!savedItem)
                return res.status(400).json({ error: `Item not found` })

            // Login, prefer to use signed in users token.
            const accessToken = await getAccessToken()
            let api = SpotifyApi.withClientCredentials(process.env.SPOTIFY_API_CLIENT_ID, process.env.SPOTIFY_API_CLIENT_SECRET);
            if (accessToken)
                api = SpotifyApi.withAccessToken(process.env.SPOTIFY_API_CLIENT_ID, accessToken)

            const data = await getSpotifyData(api, savedItem.uri)
            if (!data)
                return res.status(400).json({ error: `No data found for Spotify URI ${savedItem.uri}, it might be a private playlist` })

            return res.json(data)
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Spotify import", err);
    },
});


