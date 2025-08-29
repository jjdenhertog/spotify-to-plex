import { settingsDir } from '@spotify-to-plex/shared-utils/server';
import { SavedItem } from "@spotify-to-plex/shared-types/spotify/api";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function savedItemsHelpers() {

    // Get all saved items
    const savedItemsPath = join(settingsDir, 'spotify_saved_items.json');

    let items: SavedItem[] = []
    if (existsSync(savedItemsPath))
        items = JSON.parse(readFileSync(savedItemsPath, 'utf8'));

    const add = (toAdd: SavedItem) => {
        if (!items.some(item => item.uri == toAdd.uri))
            items.push(toAdd)
    }
    const save = () => {
        writeFileSync(savedItemsPath, JSON.stringify(items, undefined, 4))
    }

    return { items, add, save };
}