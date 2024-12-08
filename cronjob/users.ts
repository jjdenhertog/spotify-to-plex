import getAccessToken from "@/helpers/spotify/getAccessToken";
import refreshAccessTokens from "@/helpers/spotify/refreshAccessTokens";
import { configDir } from "@/library/configDir";
import { RecentPlayedContext, SavedItem, SpotifyCredentials } from "@/types/SpotifyAPI";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { useSavedItems } from "./hooks/useSavedItems";
import { loadSpotifyData } from "./utils/loadSpotifyData";


export async function syncUsers() {
    const credentialsPath = join(configDir, 'spotify.json')
    if (!existsSync(credentialsPath))
        throw new Error("No users are currently connected.")

    await refreshAccessTokens()
    const credentials: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))

    const savedItems = useSavedItems()

    for (let i = 0; i < credentials.length; i++) {
        try {
            const { user } = credentials[i];
            if (!user.sync)
                continue;

            const accessToken = await getAccessToken(user.id)
            if (!accessToken)
                continue;

            const api = SpotifyApi.withAccessToken(`${process.env.SPOTIFY_API_CLIENT_ID}`, accessToken)

            // Get the last 50 tracks.
            const recentPlayedContexts: RecentPlayedContext[] = []
            const result = await api.player.getRecentlyPlayedTracks(50)

            for (let j = 0; j < result.items.length; j++) {
                const element = result.items[j];

                // eslint-disable-next-line max-depth
                if (!recentPlayedContexts.some(item => item.uri == element.context.uri))
                    recentPlayedContexts.push(element.context)
            }

            const { label } = user;
            for (let i = 0; i < recentPlayedContexts.length; i++) {
                const context = recentPlayedContexts[i];
                if (savedItems.items.some(item => item.uri == context.uri))
                    continue;

                const data = await loadSpotifyData(context.uri, user.id, true)
                if (!data)
                    continue;

                const { type, id: resultId, title: name, image } = data;
                const savedItem: SavedItem = {
                    type,
                    uri: context.uri,
                    id: resultId,
                    title: name,
                    image,
                    sync: true,
                    sync_interval: "0",
                    label,
                    user: user.id
                }
                savedItems.add(savedItem);
            }

            // Store saved item
            savedItems.save()

            console.log("recentPlayedThings:", recentPlayedContexts)
        } catch (e) {
            console.log(e)
        }
    }


}


function run() {
    console.log(`Start syncing users`)
    syncUsers()
        .then(() => {
            console.log(`Sync complete`)
        })
        .catch((e: unknown) => {
            console.log(e)
        })
}

run();