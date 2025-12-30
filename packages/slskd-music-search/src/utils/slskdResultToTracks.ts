import type { SlskdTrack } from "../types/SlskdTrack";

/**
 * Convert SLSKD tracks to music-search Track format
 * This allows us to use the shared match filtering logic
 */
export function slskdResultToTracks(slskdTracks: SlskdTrack[]) {
    return slskdTracks.map(track => {
        // Prefer extracted metadata, fall back to empty strings
        const artist = track.metadata?.artist || '';
        const title = track.metadata?.title || '';
        const album = track.metadata?.album || '';

        return {
            id: track.filename, // Use filename as unique ID
            artist,
            title,
            album
        };
    });
}
