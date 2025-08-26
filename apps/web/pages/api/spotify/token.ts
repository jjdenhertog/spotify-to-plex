import { encrypt } from '@spotify-to-plex/shared-utils/server';
// MIGRATED: Updated to use shared utils package
import { generateError } from '@/helpers/errors/generateError';
import { settingsDir } from "@spotify-to-plex/shared-utils/server";
import { SpotifyCredentials } from '@spotify-to-plex/shared-types';
// MIGRATED: Updated to use shared types package
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const code = req.query.code as string;
            const redirectUri = `${process.env.SPOTIFY_API_REDIRECT_URI}`;
            const clientId = `${process.env.SPOTIFY_API_CLIENT_ID}`;
            const clientSecret = `${process.env.SPOTIFY_API_CLIENT_SECRET}`;

            if (!redirectUri)
                throw new Error(`Missing environment variables: SPOTIFY_API_REDIRECT_URI`)

            if (!clientId)
                throw new Error(`Missing environment variables: SPOTIFY_API_CLIENT_ID`)

            if (!clientSecret)
                throw new Error(`Missing environment variables: SPOTIFY_API_CLIENT_SECRET`)


            const tokenUrl = 'https://accounts.spotify.com/api/token';

            try {
                const response = await axios.post(
                    tokenUrl,
                    new URLSearchParams({
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: redirectUri,
                        client_id: clientId,
                        client_secret: clientSecret,
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }
                );

                const { access_token, refresh_token, expires_in, token_type } = response.data;

                const api = SpotifyApi.withAccessToken(clientId, {
                    access_token,
                    expires_in,
                    refresh_token,
                    token_type
                })
                const user = await api.currentUser.profile()
                const spotifyCredentials: SpotifyCredentials = {
                    user: {
                        id: user.id,
                        name: user.display_name
                    },
                    access_token: {
                        access_token: encrypt(access_token),
                        refresh_token: encrypt(refresh_token),
                        expires_in,
                        token_type
                    },
                    expires_at: Date.now() + expires_in
                }

                const credentialsPath = join(settingsDir, 'spotify.json')

                if (existsSync(credentialsPath)) {
                    // Update
                    const existingCredentials: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))
                    const newCredentials = existingCredentials.filter(item => item.user.id != spotifyCredentials.user.id)
                    newCredentials.push(spotifyCredentials)

                    writeFileSync(credentialsPath, JSON.stringify(newCredentials, undefined, 4))
                } else {
                    writeFileSync(credentialsPath, JSON.stringify([spotifyCredentials], undefined, 4))
                }

                res.redirect('/spotify');
            } catch (error) {
                console.error('Error exchanging code for token:', error);
                res.status(500).send('Authentication failed');
            }
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Spotify import", err);
    },
});


