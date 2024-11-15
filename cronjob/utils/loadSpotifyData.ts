import getAccessToken from "@/helpers/spotify/getAccessToken";
import getSpotifyData from "@/helpers/spotify/getSpotifyData";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export async function loadSpotifyData(uri: string, user?: string) {
    if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
        throw new Error("Spotify Credentials missing. Please add the environment variables to use this feature.");

    const accessToken = await getAccessToken(user);
    let api = SpotifyApi.withClientCredentials(process.env.SPOTIFY_API_CLIENT_ID, process.env.SPOTIFY_API_CLIENT_SECRET);
    if (accessToken)
        api = SpotifyApi.withAccessToken(process.env.SPOTIFY_API_CLIENT_ID, accessToken);

    return getSpotifyData(api, uri);
}
