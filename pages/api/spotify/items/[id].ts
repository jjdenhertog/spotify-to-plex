import { generateError } from '@/helpers/errors/generateError';
import getAccessToken from '@/helpers/spotify/getAccessToken';
import getSpotifyData from '@/helpers/spotify/getSpotifyData';
import { configDir } from "@/library/configDir";
import { SpotifySavedItem } from '@/types/SpotifyAPI';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const { id } = req.query
            if (typeof id != 'string')
                return res.status(400).json({ error: "ID missing" })

            if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                return res.status(400).json({ error: "Spotify Credentials missing. Please add the environment variables to use this feature." })

            const savedItemsPath = join(configDir, 'spotify_saved_items.json')
            if (!existsSync(savedItemsPath))
                return res.status(200).json([])

            const savedItems: SpotifySavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'))
            const savedItem = savedItems.find(item => item.id == id)
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
    onError: (err: any, req, res) => {
        generateError(req, res, "Spotify import", err);
    },
});


