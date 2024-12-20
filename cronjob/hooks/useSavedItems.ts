import { configDir } from "@/library/configDir";
import { SavedItem } from "@/types/SpotifyAPI";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function useSavedItems() {

    // Get all saved items
    const savedItemsPath = join(configDir, 'spotify_saved_items.json');

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
