import { configDir } from "@/library/configDir";
import { SpotifySavedItem } from "@/types/SpotifyAPI";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function getSavedPlaylists() {

    // Get all saved items
    const savedItemsPath = join(configDir, 'spotify_saved_items.json');
    if (!existsSync(savedItemsPath))
        throw new Error(`Found no saved items to sync`);

    const savedItems: SpotifySavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'));
    const toSyncPlaylists = savedItems.filter(item => !!item.sync && item.type == 'spotify-playlist');

    if (toSyncPlaylists.length == 0)
        throw new Error(`Found no playlists to sync`);

    return { toSyncPlaylists };
}
