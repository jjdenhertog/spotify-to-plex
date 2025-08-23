import { settingsDir } from "@/library/settingsDir"
import { SpotifyCredentials } from "@spotify-to-plex/shared-types"
// MIGRATED: Updated to use shared types package
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { decrypt } from "@spotify-to-plex/shared-utils/server"
// MIGRATED: Updated to use shared utils package
import refreshAccessTokens from "./refreshAccessTokens"

export default async function getAccessToken(userId?: string) {

    try {
        const credentialsPath = join(settingsDir, 'spotify.json')
        if (!existsSync(credentialsPath))
            throw new Error("No users are currently connected.");

        // Refresh all access tokens
        await refreshAccessTokens();

        // Load users
        const users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))
        const now = Date.now()

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (!user) continue;

            if (userId && user.user?.id != userId)
                continue;

            if (user.expires_at && now < user.expires_at) {
                return {
                    access_token: decrypt(user.access_token?.access_token || ''),
                    refresh_token: decrypt(user.access_token?.refresh_token || ''),
                    expires_in: user.access_token?.expires_in || 0,
                    token_type: user.access_token?.token_type || 'Bearer'
                }
            }
        }

        throw new Error('No valid access token found');
    } catch (error) {
        throw error;
    }
}

