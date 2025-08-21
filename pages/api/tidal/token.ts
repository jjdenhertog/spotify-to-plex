import { encrypt } from '@/helpers/encryption';
import { generateError } from '@/helpers/errors/generateError';
import { configDir } from "@/library/configDir";
import { TidalCredentials } from '@/types/TidalAPI';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const code = req.query.code as string;
            const redirectUri = `${process.env.TIDAL_API_REDIRECT_URI}`;
            const clientId = `${process.env.TIDAL_API_CLIENT_ID}`;
            const clientSecret = `${process.env.TIDAL_API_CLIENT_SECRET}`;

            const tokenUrl = 'https://auth.tidal.com/v1/oauth2/token';
            const codeVerifier = process.env.ENCRYPTION_KEY || "XClkSCrJoAxXZGVv8KZF1csyyscyLYEI-y5TEIWXIZw"

            try {
                const response = await axios.post(
                    tokenUrl,
                    new URLSearchParams({
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: redirectUri,
                        client_id: clientId,
                        client_secret: clientSecret,
                        code_verifier: codeVerifier
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }
                );

                const { access_token, refresh_token, expires_in, token_type } = response.data;

                const tidalCredentials: TidalCredentials = {
                    access_token: {
                        access_token: encrypt(access_token),
                        refresh_token: encrypt(refresh_token),
                        expires_in,
                        token_type
                    },
                    expires_at: Date.now() + expires_in
                }

                const credentialsPath = join(configDir, 'tidal.json')
                writeFileSync(credentialsPath, JSON.stringify(tidalCredentials, undefined, 4))

                res.redirect('/');
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


