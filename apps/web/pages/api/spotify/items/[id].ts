import { generateError } from '@/helpers/errors/generateError';
import { getAccessToken } from '@spotify-to-plex/shared-utils/spotify/getAccessToken';
import { getLikedSongs } from '@spotify-to-plex/shared-utils/spotify/getLikedSongs';
import { getSpotifyData } from '@spotify-to-plex/shared-utils/spotify/getSpotifyData';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { SavedItem } from '@spotify-to-plex/shared-types/spotify/SavedItem';
import { SpotifyCredentials } from '@spotify-to-plex/shared-types/spotify/SpotifyCredentials';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const { id, full } = req.query
            if (typeof id !== 'string')
                return res.status(400).json({ error: "ID missing" })

            if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                return res.status(400).json({ error: "Spotify Credentials missing. Please add the environment variables to use this feature." })

            // Handle liked songs requests
            if (id.startsWith('liked-')) {
                const userId = id.slice('liked-'.length);

                // Get user's access token
                const userAccessToken = await getAccessToken(userId);
                if (!userAccessToken)
                    return res.status(401).json({ error: "User needs to reconnect Spotify to access liked songs" });

                // Load spotify.json to get user's display name
                const credentialsPath = join(getStorageDir(), 'spotify.json');
                if (!existsSync(credentialsPath))
                    return res.status(401).json({ error: "No Spotify users connected" });

                const users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'));
                const user = users.find(u => u.user.id === userId);
                if (!user)
                    return res.status(400).json({ error: "User not found" });

                // Create SpotifyApi instance with user token
                const api = SpotifyApi.withAccessToken(process.env.SPOTIFY_API_CLIENT_ID, userAccessToken);

                // Determine if simplified mode
                const isFull = parseFloat(typeof full == 'string' ? full : "");
                const simplified = isFull != 1;

                // Call getLikedSongs
                const data = await getLikedSongs(api, userId, user.user.name, simplified);
                if (!data)
                    return res.status(500).json({ error: "Failed to fetch liked songs from Spotify" });

                return res.json(data);
            }

            const savedItemsPath = join(getStorageDir(), 'spotify_saved_items.json')
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


            const isFull = parseFloat(typeof full == 'string' ? full : "");
            const simplified = isFull != 1;

            const data = await getSpotifyData(api, savedItem.uri, simplified)
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


