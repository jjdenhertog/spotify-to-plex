import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { SavedItem } from "@spotify-to-plex/shared-types/spotify/SavedItem";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function getSavedAlbums() {

    // Get all saved items
    const savedItemsPath = join(getStorageDir(), 'spotify_saved_items.json');
    if (!existsSync(savedItemsPath))
        throw new Error(`Found no saved items to sync`);

    const savedItems: SavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'));
    const toSyncAlbums = savedItems.filter(item => !!item.sync && item.type == 'spotify-album');

    if (toSyncAlbums.length == 0)
        throw new Error(`Found no playlists to sync`);

    return { toSyncAlbums };
}
