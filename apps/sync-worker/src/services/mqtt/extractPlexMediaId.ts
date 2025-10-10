/**
 * Extract Plex ID from plex-media URI
 * Parses /library/metadata/{id} or /playlists/{id} patterns
 */
export function extractPlexMediaId(uri: string): string | null {
    // Try /playlists/{id} or /playlists/{id}/items pattern first
    const playlistMatch = /\/playlists\/(\d+)/.exec(uri);
    if (playlistMatch) {
        return playlistMatch[1] ?? null;
    }

    // Fall back to /library/metadata/{id} pattern
    const metadataMatch = /\/library\/metadata\/(\d+)/.exec(uri);
    
    return metadataMatch ? (metadataMatch[1] ?? null) : null;
}
