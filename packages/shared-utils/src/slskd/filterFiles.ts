import type { SlskdCollectedFile } from './types';

/**
 * Filter collected files by quality preferences
 *
 * Filtering logic (follows slskd.go algorithm exactly):
 * 1. Process files in extension preference order (first in list = highest priority)
 * 2. For each extension:
 *    - Filter by minimum bitrate (if > 0)
 *    - Filter by minimum bitdepth (if > 0)
 *    - Collect up to downloadAttempts files
 * 3. Return early once downloadAttempts files are collected
 *
 * @param files - Collected files from search results
 * @param extensionPriority - Extensions in preference order (e.g., ['flac', 'mp3'])
 * @param minBitRate - Minimum bitrate filter (0 = no filter)
 * @param minBitDepth - Minimum bitdepth filter (0 = no filter)
 * @param downloadAttempts - Maximum number of files to return
 * @returns Filtered array of files (up to downloadAttempts)
 * @throws Error if no files match the filters
 */
export function filterFiles(
    files: SlskdCollectedFile[],
    extensionPriority: string[],
    minBitRate: number = 0,
    minBitDepth: number = 0,
    downloadAttempts: number = 3
): SlskdCollectedFile[] {
    const filtered: SlskdCollectedFile[] = [];

    // Process files in extension preference order
    for (const ext of extensionPriority) {
        for (const file of files) {
            // Skip if extension doesn't match
            if (file.extension !== ext) {
                continue;
            }

            // Filter by minimum bitrate
            if (minBitRate > 0 && file.bitRate > 0 && file.bitRate < minBitRate) {
                continue;
            }

            // Filter by minimum bitdepth
            if (minBitDepth > 0 && file.bitDepth > 0 && file.bitDepth < minBitDepth) {
                continue;
            }

            // Add file to filtered results
            filtered.push(file);

            // Return early if we have enough files
            if (filtered.length >= downloadAttempts) {
                return filtered;
            }
        }
    }

    if (filtered.length === 0) {
        throw new Error('No files found that match filters');
    }

    return filtered;
}
