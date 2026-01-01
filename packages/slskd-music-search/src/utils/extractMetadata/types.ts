/* eslint-disable custom/no-export-only-files */
/**
 * Types for metadata extraction
 */

export type ExtractedMetadata = {
    artist: string;
    title: string;
    album: string;
    pattern: string;
}

export type ExtractionResult = {
    success: boolean;
    metadata?: ExtractedMetadata;
    error?: string;
}

export type ExtractionPattern = {
    name: string;
    description: string;
    extract: (filePath: string) => ExtractionResult;
}

export type ExtractionStats = {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    patternDistribution: Record<string, number>;
}
