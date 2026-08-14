import { encrypt } from '@spotify-to-plex/shared-utils/security/encrypt';
import { generateError } from '@/helpers/errors/generateError';
import { getStorageDir } from "@spotify-to-plex/shared-utils/utils/getStorageDir";
import { SpotifyCredentials } from '@spotify-to-plex/shared-types/spotify/SpotifyCredentials';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getAuthErrorMessage(error: unknown): { title: string; message: string; details: Record<string, string> } {
    // Axios error with response from Spotify
    if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data;
        const spotifyError = typeof data.error === 'string' ? data.error : undefined;
        const spotifyDescription = typeof data.error_description === 'string' ? data.error_description : undefined;
        const status = String(error.response.status);

        const details: Record<string, string> = {};
        if (spotifyError) details.error = spotifyError;
        if (spotifyDescription) details.error_description = spotifyDescription;
        details.status = status;

        if (spotifyError === 'invalid_grant') {
            if (spotifyDescription?.toLowerCase().includes('expired')) {
                return { title: 'Authorization Code Expired', message: 'Your authorization code has expired. Please go back and try connecting again. Authorization codes are only valid for a short time.', details };
            }
            if (spotifyDescription?.toLowerCase().includes('redirect')) {
                return { title: 'Redirect URI Mismatch', message: 'The redirect URI doesn\'t match what\'s configured in your Spotify app. Check that your redirect URI matches exactly in your Spotify Developer Dashboard, including trailing slashes.', details };
            }
            return { title: 'Invalid Authorization Code', message: 'The authorization code was invalid or has already been used. Please try connecting again.', details };
        }

        if (spotifyError === 'invalid_client') {
            return { title: 'Invalid Client Credentials', message: 'Your Spotify API credentials are invalid. Verify that SPOTIFY_API_CLIENT_ID and SPOTIFY_API_CLIENT_SECRET are correct in your environment configuration.', details };
        }

        if (spotifyError === 'unauthorized_client') {
            return { title: 'Unauthorized Client', message: 'This Spotify app is not authorized for this grant type. Check your app settings in the Spotify Developer Dashboard.', details };
        }

        return { title: 'Authentication Failed', message: 'An unexpected error occurred during authentication. See the technical details below for more information.', details };
    }

    // Axios error without response (network failure, timeout)
    if (axios.isAxiosError(error) && !error.response) {
        return {
            title: 'Connection Failed',
            message: 'Could not connect to Spotify\'s servers. Check your internet connection and try again.',
            details: { error: error.code || 'NETWORK_ERROR', error_description: error.message }
        };
    }

    // Invalid encryption key length (ENCRYPTION_KEY misconfigured)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Invalid key length')) {
        return {
            title: 'Invalid Encryption Key',
            message: 'The ENCRYPTION_KEY environment variable must be exactly 32 bytes (64 hex characters). Please check your configuration. See installation instructions: https://jjdenhertog.github.io/spotify-to-plex/installation.html',
            details: { error: 'invalid_key_length', error_description: errorMessage }
        };
    }

    // Non-Axios errors (file I/O, JSON parse, profile fetch, etc.)
    return {
        title: 'Authentication Failed',
        message: 'An unexpected error occurred during authentication. See the technical details below for more information.',
        details: { error: 'internal_error', error_description: errorMessage }
    };
}

function renderAuthErrorPage(title: string, message: string, details: Record<string, string>): string {
    const detailRows = Object.entries(details)
        .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`)
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)} - Spotify to Plex</title>
    <style>
        body { margin:0; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f5f5f5; color:#333; }
        .card { max-width:600px; margin:0 auto; background:#fff; border-radius:8px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
        h1 { margin:0 0 16px; font-size:22px; color:#d32f2f; }
        p { margin:0 0 24px; font-size:16px; line-height:1.5; }
        .details { background:#f9f9f9; border-radius:4px; padding:12px; }
        summary { cursor:pointer; font-weight:600; font-size:14px; }
        table { margin-top:12px; font-size:13px; color:#666; border-collapse:collapse; }
        td:first-child { padding:4px 12px 4px 0; font-weight:600; vertical-align:top; }
        td:last-child { padding:4px 0; word-break:break-word; }
        @media (prefers-color-scheme: dark) {
            body { background:#121212; color:#e0e0e0; }
            .card { background:#1e1e1e; box-shadow:0 1px 3px rgba(0,0,0,0.4); }
            h1 { color:#ef5350; }
            .details { background:#2a2a2a; }
            table { color:#999; }
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <details class="details">
            <summary>Technical Details</summary>
            <table>${detailRows}</table>
        </details>
    </div>
</body>
</html>`;
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            // Handle user denial from Spotify consent screen
            if (req.query.error) {
                const queryError = (Array.isArray(req.query.error) ? req.query.error[0] : req.query.error) || 'unknown_error';
                const queryErrorDesc = Array.isArray(req.query.error_description) ? req.query.error_description[0] : req.query.error_description;
                const errorDescription = queryErrorDesc || 'Authorization was denied.';
                res.setHeader('Content-Type', 'text/html');
                return res.status(400).send(renderAuthErrorPage(
                    'Authorization Denied',
                    'You denied the Spotify authorization request. If this was a mistake, go back and try connecting again.',
                    { error: queryError, error_description: errorDescription }
                ));
            }

            if (!req.query.code) {
                res.setHeader('Content-Type', 'text/html');
                return res.status(400).send(renderAuthErrorPage(
                    'Missing Authorization Code',
                    'No authorization code was received from Spotify. Please try connecting again.',
                    { error: 'missing_code', error_description: 'The code query parameter was not provided.' }
                ));
            }

            const code = req.query.code as string;
            // Get redirect_uri from query (public redirect flow) or fall back to env var (direct/legacy)
            const redirectUri = (req.query.redirect_uri as string) || `${process.env.SPOTIFY_API_REDIRECT_URI}`;
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
                    expires_at: Date.now() + (expires_in * 1000)
                }

                const credentialsPath = join(getStorageDir(), 'spotify.json')

                if (existsSync(credentialsPath)) {
                    // Update
                    const existingCredentials: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))
                    const newCredentials = existingCredentials.filter(item => item.user.id !== spotifyCredentials.user.id)
                    newCredentials.push(spotifyCredentials)

                    writeFileSync(credentialsPath, JSON.stringify(newCredentials, undefined, 4))
                } else {
                    writeFileSync(credentialsPath, JSON.stringify([spotifyCredentials], undefined, 4))
                }

                res.redirect('/manage-users');
            } catch (error) {
                console.error('Error exchanging code for token:', error);
                const { title, message, details } = getAuthErrorMessage(error);
                const status = axios.isAxiosError(error) ? 400 : 500;
                res.setHeader('Content-Type', 'text/html');
                res.status(status).send(renderAuthErrorPage(title, message, details));
            }
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Spotify import", err);
    },
});


