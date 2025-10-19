import path from 'node:path';
import type { SlskdSearchResults, SlskdCollectedFile, SlskdTrackInfo } from './types';
import { sanitizeName } from './utils/sanitizeName';
import { containsLower } from './utils/containsLower';

/**
 * Collect all files from search results that match track criteria
 *
 * Filtering logic (follows slskd.go algorithm exactly):
 * 1. Only process results with fileCount > 0 AND hasFreeUploadSlot
 * 2. Filter files by:
 *    - Extension must be in allowed list
 *    - Filename must contain (artist OR album) AND title
 *
 * @param track - Track information to search for
 * @param searchResults - Raw search results from SLSKD
 * @param allowedExtensions - List of allowed file extensions (e.g., ['flac', 'mp3'])
 * @returns Array of collected files with username attached
 * @throws Error if no files match the criteria
 */
export function collectFiles(
    track: SlskdTrackInfo,
    searchResults: SlskdSearchResults,
    allowedExtensions: string[]
    // maxLengthDifference: number = 10 // TODO: Re-enable when Track type includes duration_ms
): SlskdCollectedFile[] {
    const sanitizedArtist = sanitizeName(track.artist);
    const sanitizedAlbum = sanitizeName(track.album);
    const sanitizedTitle = sanitizeName(track.title);

    const collectedFiles: SlskdCollectedFile[] = [];

    for (const result of searchResults) {
        // Only process results with files and free upload slots
        if (result.fileCount <= 0 || !result.hasFreeUploadSlot) {
            continue;
        }

        for (const file of result.files) {
            // Normalize extension
            let extension = file.extension.toLowerCase().replace(/^\./, '');

            // If no extension in metadata, extract from filename
            if (!extension) {
                const filenameExt = path.extname(file.filename).toLowerCase()
                    .replace(/^\./, '');
                extension = sanitizeName(filenameExt);
            }

            // Filter by allowed extensions
            if (!allowedExtensions.includes(extension)) {
                continue;
            }

            // TODO: Re-enable when Track type includes duration_ms
            // Filter by duration (maxLengthDifference tolerance)
            // track.duration is in milliseconds, file.length is in seconds
            // if (track.duration > 0) {
            //     const trackDurationSeconds = track.duration / 1000;
            //     const durationDiff = Math.abs(trackDurationSeconds - file.length);
            //
            //     if (durationDiff > maxLengthDifference) {
            //         continue;
            //     }
            // }

            // Filter by filename matching
            const sanitizedFilename = sanitizeName(file.filename);
            const matchesArtistOrAlbum =
                containsLower(sanitizedFilename, sanitizedArtist) ||
                containsLower(sanitizedFilename, sanitizedAlbum);
            const matchesTitle = containsLower(sanitizedFilename, sanitizedTitle);

            if (matchesArtistOrAlbum && matchesTitle) {
                collectedFiles.push({
                    ...file,
                    extension, // Use normalized extension
                    username: result.username
                });
            }
        }
    }

    if (collectedFiles.length === 0) {
        throw new Error(`No tracks passed collection for ${track.artist} - ${track.title}`);
    }

    return collectedFiles;
}
