import { generateError } from '@/helpers/errors/generateError';
import refreshAccessTokens from '@/helpers/spotify/refreshAccessTokens';
import { RecentPlayedContext, SpotifyCredentials } from '@/types/SpotifyAPI';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { configDir } from '../..';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            const credentialsPath = join(configDir, 'spotify.json')
            if (!existsSync(credentialsPath))
                return res.status(400).json({ error: "No users are currently connected." })

            await refreshAccessTokens()
            const users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))

            for (let i = 0; i < users.length; i++) {
                try {
                    const user = users[i];
                    const api = SpotifyApi.withAccessToken(`${process.env.SPOTIFY_API_CLIENT_ID}`, user.access_token)

                    // Get the last 300 tracks.
                    const recentPlayedThings: RecentPlayedContext[] = []
                    const result = await api.player.getRecentlyPlayedTracks(50)

                    for (let j = 0; j < result.items.length; j++) {
                        const element = result.items[j];

                        // eslint-disable-next-line max-depth
                        if (!recentPlayedThings.some(item => item.uri == element.context.uri))
                            recentPlayedThings.push(element.context)
                    }

                    console.log("recentPlayedThings:", recentPlayedThings)
                } catch (e) {
                    console.log(e)
                }
            }
            res.json([])
        }

    )

export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Spotify import", err);
    },
});


