import { configDir } from "@/library/configDir"
import { SpotifyCredentials } from "@/types/SpotifyAPI"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { decrypt } from "../encryption"
import refreshAccessTokens from "./refreshAccessTokens"

export default async function getAccessToken(userId?: string) {

    try {
        const credentialsPath = join(configDir, 'spotify.json')
        if (!existsSync(credentialsPath))
            throw new Error("No users are currently connected.");

        // Refresh all access tokens
        await refreshAccessTokens();

        // Load users
        const users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))
        const now = Date.now()

        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            if (userId && user.user.id != userId)
                continue;

            if (now < user.expires_at) {
                return {
                    access_token: decrypt(user.access_token.access_token),
                    refresh_token: decrypt(user.access_token.refresh_token),
                    expires_in: user.access_token.expires_in,
                    token_type: user.access_token.token_type
                }
            }
        }

    } catch (_e) {

    }
}

