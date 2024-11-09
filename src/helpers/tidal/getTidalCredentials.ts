import { configDir } from "@/pages/index";
import { TidalCredentials } from "@/types/TidalAPI";
import axios from "axios";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decrypt, encrypt } from '../encryption';

export default async function getTidalCredentials() {
    const credentialsPath = join(configDir, 'tidal.json')
    if (!existsSync(credentialsPath))
        return;

    const clientId = process.env.TIDAL_API_CLIENT_ID;
    const clientSecret = process.env.TIDAL_API_CLIENT_SECRET;

    if (!clientId)
        throw new Error(`Missing environment variables: TIDAL_API_CLIENT_ID`)

    if (!clientSecret)
        throw new Error(`Missing environment variables: TIDAL_API_CLIENT_SECRET`)


    const credentials: TidalCredentials = JSON.parse(readFileSync(credentialsPath, 'utf8'))
    const now = Date.now()

    if (now < credentials.expires_at)
        return credentials;

    // Reload token
    try {
        const response = await axios.post(
            'https://auth.tidal.com/v1/oauth2/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: decrypt(credentials.access_token.refresh_token),
                client_id: clientId,
                client_secret: clientSecret
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token, expires_in, refresh_token, token_type } = response.data;
        const newRefreshToken = refresh_token ? encrypt(refresh_token) : "";

        credentials.access_token = {
            access_token: encrypt(access_token),
            expires_in,
            refresh_token: newRefreshToken || credentials.access_token.refresh_token,
            token_type
        }

        credentials.expires_at = now + (expires_in * 1000)
        writeFileSync(credentialsPath, JSON.stringify(credentials, undefined, 4))

        return credentials;
        // Store
    } catch (e) {
        console.log(e)
    }
}