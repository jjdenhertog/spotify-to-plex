import { settingsDir } from "../../library/settingsDir"
import { SpotifyCredentials } from "../../types/SpotifyAPI"
import axios from "axios"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { decrypt, encrypt } from "../encryption"

export default async function refreshAccessTokens() {
    const credentialsPath = join(settingsDir, 'spotify.json')
    if (!existsSync(credentialsPath))
        throw new Error("No users are currently connected.");

    const clientId = process.env.SPOTIFY_API_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_API_CLIENT_SECRET

    if (!clientId)
        throw new Error(`Missing environment variables: SPOTIFY_API_CLIENT_ID`)

    if (!clientSecret)
        throw new Error(`Missing environment variables: SPOTIFY_API_CLIENT_SECRET`)

    const users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))
    const now = Date.now()

    const newUsers: SpotifyCredentials[] = []

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (!user || now > user.expires_at) {

            try {
                if (!user?.access_token?.refresh_token) continue;
                const refreshToken = decrypt(user.access_token.refresh_token);

                const response = await axios.post(
                    'https://accounts.spotify.com/api/token',
                    new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken,
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
                newUsers.push({
                    user: user.user,
                    access_token: {
                        access_token: encrypt(access_token),
                        refresh_token: newRefreshToken || user.access_token.refresh_token,
                        expires_in,
                        token_type
                    },
                    expires_at: now + (expires_in * 1000)
                })
            } catch (e) {
                console.log(e)
            }
        }
    }

    if (newUsers.length > 0) {

        const allUsers = users
            .filter(item => item?.user?.id && !newUsers.some(newUser => newUser?.user?.id === item.user.id))
            .concat(newUsers)

        writeFileSync(credentialsPath, JSON.stringify(allUsers, undefined, 4))
    }

}