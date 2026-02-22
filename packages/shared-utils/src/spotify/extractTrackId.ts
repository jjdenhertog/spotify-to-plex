/**
 * Extracts a unique identifier for a Spotify track from its URI or ID
 * Handles both regular tracks (spotify:track:id) and local tracks (spotify:local:artist:album:title:duration)
 */
export function extractTrackId(trackId: string | undefined | null): string | null {
    if (!trackId) return null;

    // Handle spotify:track: URIs
    if (trackId.startsWith('spotify:track:')) {
        return trackId.replace('spotify:track:', '');
    }

    // Handle spotify:local: URIs - use the full URI as unique identifier
    // These tracks have the format: spotify:local:artist:album:track:duration
    if (trackId.startsWith('spotify:local:')) {
        return trackId; // Use full URI as unique ID for local tracks
    }

    // If it's already just an ID (no prefix), return as-is
    return trackId;
}

/**
 * Checks if a track ID represents a local track
 */
export function isLocalTrack(trackId: string | undefined | null): boolean {
    return typeof trackId === 'string' && trackId.startsWith('spotify:local:');
}

/**
 * Extracts artist name from a local track URI
 * Format: spotify:local:artist:album:track:duration
 */
export function extractLocalTrackArtist(trackId: string | undefined | null): string | null {
    if (!isLocalTrack(trackId)) return null;

    const parts = trackId.split(':');
    // parts[0] = 'spotify', parts[1] = 'local', parts[2] = artist
    if (parts.length >= 3) {
        return decodeURIComponent(parts[2]);
    }
    return null;
}

/**
 * Extracts album name from a local track URI
 * Format: spotify:local:artist:album:track:duration
 */
export function extractLocalTrackAlbum(trackId: string | undefined | null): string | null {
    if (!isLocalTrack(trackId)) return null;

    const parts = trackId.split(':');
    // parts[0] = 'spotify', parts[1] = 'local', parts[2] = artist, parts[3] = album
    if (parts.length >= 4) {
        return decodeURIComponent(parts[3]);
    }
    return null;
}

/**
 * Extracts track title from a local track URI
 * Format: spotify:local:artist:album:track:duration
 */
export function extractLocalTrackTitle(trackId: string | undefined | null): string | null {
    if (!isLocalTrack(trackId)) return null;

    const parts = trackId.split(':');
    // parts[0] = 'spotify', parts[1] = 'local', parts[2] = artist, parts[3] = album, parts[4] = track
    if (parts.length >= 5) {
        return decodeURIComponent(parts[4]);
    }
    return null;
}
