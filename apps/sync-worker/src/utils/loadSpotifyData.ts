import { getAccessToken } from "@spotify-to-plex/shared-utils/spotify/getAccessToken";
import { getLikedSongs } from "@spotify-to-plex/shared-utils/spotify/getLikedSongs";
import { getSpotifyData } from "@spotify-to-plex/shared-utils/spotify/getSpotifyData";
import { getStorageDir } from "@spotify-to-plex/shared-utils/utils/getStorageDir";
import { SpotifyCredentials } from "@spotify-to-plex/shared-types/spotify/SpotifyCredentials";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export async function loadSpotifyData(uri: string, user?: string, simplified: boolean = false) {
    if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
        throw new Error("Spotify Credentials missing. Please add the environment variables to use this feature.");

    // Handle liked songs URI pattern
    if (uri.startsWith('spotify:liked:')) {
        const userId = uri.slice('spotify:liked:'.length).trim();

        // Get user's access token (REQUIRED for liked songs)
        const accessToken = await getAccessToken(userId);
        if (!accessToken) 
            throw new Error(`User authentication required for liked songs. Please reconnect Spotify for user ID: ${userId}`);

        // Load spotify.json to get user's display name
        const credentialsPath = join(getStorageDir(), "spotify.json");
        if (!existsSync(credentialsPath)) 
            throw new Error("No users are currently connected.");

        const users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, "utf8"));
        const userCredentials = users.find(u => u.user.id === userId);

        if (!userCredentials) 
            throw new Error(`User not found: ${userId}`);

        // Create SpotifyApi with user token
        const api = SpotifyApi.withAccessToken(process.env.SPOTIFY_API_CLIENT_ID, accessToken);

        // Call getLikedSongs and return result
        const result = await getLikedSongs(api, userId, userCredentials.user.name, simplified);

        if (!result) 
            throw new Error(`Failed to fetch liked songs for user: ${userId}`);

        return result;
    }

    const accessToken = await getAccessToken(user);
    let api = SpotifyApi.withClientCredentials(
        process.env.SPOTIFY_API_CLIENT_ID,
        process.env.SPOTIFY_API_CLIENT_SECRET
    );

    if (accessToken)
        api = SpotifyApi.withAccessToken(process.env.SPOTIFY_API_CLIENT_ID, accessToken);

    try {
        return await getSpotifyData(api, uri, simplified, true);
    } catch {

        if (accessToken) {
            console.log(`User token failed for ${uri}, retrying with client credentials...`);
            const clientApi = SpotifyApi.withClientCredentials(
                process.env.SPOTIFY_API_CLIENT_ID,
                process.env.SPOTIFY_API_CLIENT_SECRET
            );

            return getSpotifyData(clientApi, uri, simplified);
        }

        // Re-throw the original error if we can't/shouldn't fallback
        throw new Error(`Failed to load Spotify data`);
    }
}
