/**
 * Metadata Extraction Module
 *
 * Extracts artist, title, and album from Soulseek file paths using
 * multiple pattern matching strategies.
 *
 * Patterns (in priority order):
 * 1. filenameArtistTitle - "Artist - Title" from filename (most common)
 * 2. hierarchicalFolder  - /Artist/Album/Title structure
 * 3. combinedFolder      - /Artist - Album/Title structure
 */

import type { ExtractionResult, ExtractionStats, ExtractionPattern } from './extractMetadata/types';
import {
    getPathParts,
    hasArtistTitleInFilename,
    looksLikeArtistAlbumFolder,
    getFilename,
    getParentFolder
} from './extractMetadata/helpers';
import { filenameArtistTitlePattern } from './extractMetadata/patterns/filenameArtistTitle';
import { hierarchicalFolderPattern } from './extractMetadata/patterns/hierarchicalFolder';
import { combinedFolderPattern } from './extractMetadata/patterns/combinedFolder';

// Re-export types
export type { ExtractedMetadata, ExtractionResult, ExtractionStats, ExtractionPattern } from './extractMetadata/types';

/**
 * Extraction patterns in priority order (first = highest priority)
 */
const allPatterns: ExtractionPattern[] = [
    filenameArtistTitlePattern,  // Most common: "Artist - Title" in filename
    hierarchicalFolderPattern,   // Common: /Artist/Album/Title structure
    combinedFolderPattern       // Alternative: /Artist - Album/Title structure
];

/**
 * Determine optimal pattern order based on path characteristics
 */
function determinePatternOrder(filePath: string): ExtractionPattern[] {
    const parts = getPathParts(filePath);
    const filename = getFilename(filePath);
    const folderName = getParentFolder(filePath);

    const filenameHasArtist = hasArtistTitleInFilename(filename);
    const folderIsCombined = looksLikeArtistAlbumFolder(folderName);

    // Score each pattern: array index = base priority, lower = better
    const scored = allPatterns.map((pattern, index) => {
        let score = index;

        switch (pattern.name) {
            case 'filename-artist-title':
                if (filenameHasArtist)
                    score -= 10;

                break;

            case 'hierarchical-folder':
                if (parts.length >= 3 && !folderIsCombined)
                    score -= 5;

                break;

            case 'combined-folder':
                if (folderIsCombined)
                    score -= 5;

                break;
        }

        return { pattern, score };
    });

    return scored.sort((a, b) => a.score - b.score).map(s => s.pattern);
}

/**
 * Main extraction function - tries patterns in optimal order
 */
export function extractMetadata(filePath: string): ExtractionResult {
    const orderedPatterns = determinePatternOrder(filePath);

    for (const pattern of orderedPatterns) {
        const result = pattern.extract(filePath);
        if (result.success) {
            return result;
        }
    }

    return {
        success: false,
        error: 'No extraction pattern matched'
    };
}

/**
 * Extract metadata from multiple file paths
 */
export function extractMetadataBatch(filePaths: string[]): ExtractionResult[] {
    return filePaths.map(extractMetadata);
}

/**
 * Calculate extraction success rate for a batch
 */
export function calculateSuccessRate(results: ExtractionResult[]): number {
    if (results.length === 0) return 0;

    return results.filter(r => r.success).length / results.length;
}

/**
 * Get statistics for extraction results
 */
export function getExtractionStats(results: ExtractionResult[]): ExtractionStats {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const patternDistribution: Record<string, number> = {};

    for (const result of successful) {
        if (result.metadata) {
            const { pattern } = result.metadata;
            patternDistribution[pattern] = (patternDistribution[pattern] || 0) + 1;
        }
    }

    return {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        successRate: calculateSuccessRate(results),
        patternDistribution
    };
}
