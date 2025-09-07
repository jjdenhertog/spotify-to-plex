import { logger } from "../utils/logger";
import { getAccessToken } from "@spotify-to-plex/shared-utils/spotify/getAccessToken";
import { refreshAccessTokens } from "@spotify-to-plex/shared-utils/spotify/refreshAccessTokens";
import { settingsDir } from "@spotify-to-plex/shared-utils/utils/settingsDir";
import { RecentPlayedContext } from "@spotify-to-plex/shared-types/spotify/RecentPlayedContext";
import { SavedItem } from "@spotify-to-plex/shared-types/spotify/SavedItem";
import { SpotifyCredentials } from "@spotify-to-plex/shared-types/spotify/SpotifyCredentials";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { savedItemsHelpers } from "../helpers/savedItemsHelpers";
import { loadSpotifyData } from "../utils/loadSpotifyData";


export async function syncUsers() {
    const credentialsPath = join(settingsDir, 'spotify.json')
    if (!existsSync(credentialsPath))
        throw new Error("No users are currently connected.")

    await refreshAccessTokens()
    const credentials: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))

    const savedItems = savedItemsHelpers()

    for (let i = 0; i < credentials.length; i++) {
        try {
            const credential = credentials[i];
            if (!credential?.user)
                continue;

            const { user } = credential;
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

                 
                if (element?.context && !recentPlayedContexts.some(item => item.uri == element.context.uri))
                    recentPlayedContexts.push(element.context)
            }

            const { label, id: userId } = user;

            for (let i = 0; i < recentPlayedContexts.length; i++) {
                const context = recentPlayedContexts[i];
                if (!context?.uri || savedItems.items.some(item => item.uri == context.uri))
                    continue;

                const data = await loadSpotifyData(context.uri, userId, true)
                if (!data)
                    continue;

                const { type, id: resultId, title: name, image } = data;
                const savedItem: SavedItem = {
                    type: type as SavedItem['type'],
                    uri: context.uri,
                    id: resultId,
                    title: name,
                    image,
                    sync: true,
                    sync_interval: "0",
                    label,
                    user: userId
                }
                savedItems.add(savedItem);
            }

            // Store saved item
            savedItems.save()

            logger.info("recentPlayedThings:", recentPlayedContexts)
        } catch (e) {
            logger.info(String(e))
        }
    }


}


function run() {
    logger.info(`Start syncing users`)
    syncUsers()
        .then(() => {
            logger.info(`Sync complete`)
        })
        .catch((e: unknown) => {
            logger.info(String(e))
        })
}

run();