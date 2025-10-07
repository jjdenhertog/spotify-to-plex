import { getAccessToken } from "@spotify-to-plex/shared-utils/spotify/getAccessToken";
import { getSpotifyData } from "@spotify-to-plex/shared-utils/spotify/getSpotifyData";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export async function loadSpotifyData(uri: string, user?: string, simplified: boolean = false) {
    if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
        throw new Error("Spotify Credentials missing. Please add the environment variables to use this feature.");

    const accessToken = await getAccessToken(user);
    let api = SpotifyApi.withClientCredentials(process.env.SPOTIFY_API_CLIENT_ID, process.env.SPOTIFY_API_CLIENT_SECRET);
    if (accessToken)
        api = SpotifyApi.withAccessToken(process.env.SPOTIFY_API_CLIENT_ID, accessToken);

    return getSpotifyData(api, uri, simplified);
}
