import { settingsDir } from "../utils/settingsDir"
import { SpotifyCredentials } from "@spotify-to-plex/shared-types/spotify/SpotifyCredentials"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { decrypt } from "../security/decrypt"
import { refreshAccessTokens } from "./refreshAccessTokens"

export async function getAccessToken(
    userId?: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: string } | undefined> {
    try {
        const credentialsPath = join(settingsDir, "spotify.json")
        if (!existsSync(credentialsPath))
            throw new Error("No users are currently connected.")

        // Refresh all access tokens
        await refreshAccessTokens()

        // Load users
        const users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, "utf8"))
        const now = Date.now()

        for (let i = 0; i < users.length; i++) {
            const user = users[i]
            if (!user)
                continue

            if (userId && user.user.id != userId)
                continue

            if (now < user.expires_at) {
                return {
                    access_token: decrypt(user.access_token.access_token),
                    refresh_token: decrypt(user.access_token.refresh_token),
                    expires_in: user.access_token.expires_in,
                    token_type: user.access_token.token_type
                }
            }
        }
    } catch (_e) {}

    return undefined
}
