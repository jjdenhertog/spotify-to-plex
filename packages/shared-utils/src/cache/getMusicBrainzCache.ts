import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { getStorageDir } from "../utils/getStorageDir"

type MusicBrainzAlbumCache = {
    spotify_album_id: string;
    musicbrainz_release_group_id: string;
    musicbrainz_artist_id: string;
    cached_at: number; // Unix timestamp
}

export function getMusicBrainzCache() {
    //////////////////////////////////////
    // Handling cached MusicBrainz links
    //////////////////////////////////////
    const path = join(getStorageDir(), 'album_musicbrainz_links.json')
    let all: MusicBrainzAlbumCache[] = []

    if (existsSync(path))
        all = JSON.parse(readFileSync(path, 'utf8'))

    /**
     * Get cached MusicBrainz data for a Spotify album
     * @param spotifyAlbumId - The Spotify album ID to lookup
     * @returns The cached MusicBrainz data or undefined if not found
     */
    const get = (spotifyAlbumId: string): MusicBrainzAlbumCache | undefined => {
        return all.find(item => item.spotify_album_id === spotifyAlbumId)
    }

    /**
     * Add or update MusicBrainz cache entry
     * Deduplicates by spotify_album_id
     * @param entry - The MusicBrainz cache entry to add/update
     */
    const add = (entry: Omit<MusicBrainzAlbumCache, 'cached_at'>) => {
        // Remove existing entry if present (deduplication)
        all = all.filter(item => item.spotify_album_id !== entry.spotify_album_id)

        // Add new entry with timestamp
        const cacheEntry: MusicBrainzAlbumCache = {
            ...entry,
            cached_at: Date.now()
        }

        all.push(cacheEntry)

        // Write to file
        writeFileSync(path, JSON.stringify(all, undefined, 4))
    }

    /**
     * Add multiple MusicBrainz cache entries at once
     * Deduplicates by spotify_album_id
     * @param entries - Array of MusicBrainz cache entries to add/update
     */
    const addBatch = (entries: Omit<MusicBrainzAlbumCache, 'cached_at'>[]) => {
        const timestamp = Date.now()

        // Create a set of new spotify_album_ids for efficient deduplication
        const newSpotifyIds = new Set(entries.map(e => e.spotify_album_id))

        // Remove existing entries that will be replaced
        all = all.filter(item => !newSpotifyIds.has(item.spotify_album_id))

        // Add new entries with timestamp
        const cacheEntries: MusicBrainzAlbumCache[] = entries.map(entry => ({
            ...entry,
            cached_at: timestamp
        }))

        all.push(...cacheEntries)

        // Write to file
        writeFileSync(path, JSON.stringify(all, undefined, 4))
    }

    return { path, all, get, add, addBatch }
}
