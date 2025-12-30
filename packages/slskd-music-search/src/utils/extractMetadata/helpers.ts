/**
 * Shared helper functions for metadata extraction
 */

/**
 * Track number patterns to strip from filenames
 * Order matters - more specific patterns first
 */
const TRACK_NUMBER_PATTERNS = [
    /^(cd|disc)\s*\d+\s*[._-]\s*\d{1,3}\s*[._-]\s*/i,  // "CD1-01 - ", "Disc 1-01."
    /^(cd|disc)\s*\d+\s*[._-]\s*/i,    // "CD1-", "Disc 2."
    /^\d+-\d+\s*[._-]\s*/,             // "1-01 - " (disc-track)
    /^\[(\d{1,3})]\s*/,                // "[01] "
    /^\((\d{1,3})\)\s*/,               // "(01) "
    /^(\d{1,3})\s*[._-]\s*/,           // "01 - ", "1. ", "001_"
    /^(\d{1,3})\s+(?=[A-Za-z])/       // "01 " followed by letter
];

/**
 * Generic/invalid folder names to ignore when extracting album
 */
const INVALID_FOLDER_NAMES = new Set([
    'music', 'audio', 'files', 'downloads', 'download', 'path', 'folder',
    'invalid', 'unknown', 'various', 'songs', 'complete', 'incomplete',
    'soulseek', 'slsk', 'nicotine', 'liked songs', 'singles', 'tracks',
    'albums', 'discography', 'collection', 'library', 'media', 'mp3',
    'flac', 'lossless', 'lossy', 'new', 'temp', 'tmp', 'incoming'
]);

/**
 * Strip track numbers from the beginning of a string
 */
function stripTrackNumber(text: string): string {
    let cleaned = text;

    for (const pattern of TRACK_NUMBER_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }

    return cleaned;
}

/**
 * Normalize various dash types to standard " - " separator
 * Handles: em-dash (—), en-dash (–), double dash (--), and inconsistent spacing
 */
function normalizeDashes(text: string): string {
    return text
        .replace(/\s*[–—]\s*/g, ' - ')     // em-dash, en-dash
        .replace(/\s*--\s*/g, ' - ')        // double dash
        .replace(/\s+-\s+/g, ' - ')         // normalize spacing around dash
        .replace(/\s+/g, ' ')               // collapse multiple spaces
        .trim();
}

/**
 * Strip square bracket suffixes (YouTube IDs, quality tags, etc.)
 * Examples: [ABC123def], [FLAC], [320], [Official Video]
 */
function stripBracketSuffix(text: string): string {
    // Remove trailing [...] patterns
    return text.replace(/\s*\[[^\]]*]\s*$/g, '').trim();
}

/**
 * Normalize text by trimming, handling multiple spaces, and cleaning up
 */
export function normalizeText(text: string): string {
    return text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
}

/**
 * Remove file extension from filename
 */
function removeExtension(filename: string): string {
    return filename.replace(/\.[^.]+$/, '');
}

/**
 * Check if a string looks like a meaningful metadata field
 */
function isMeaningfulMetadata(text: string): boolean {
    const trimmed = text.trim();

    if (trimmed.length === 0) return false;

    // Too short to be meaningful (except for short artist names like "U2", "MF")
    if (trimmed.length === 1 && !/^[\da-z]$/i.test(trimmed)) return false;

    // Generic/invalid folder names
    if (INVALID_FOLDER_NAMES.has(trimmed.toLowerCase())) return false;

    return true;
}

/**
 * Validate that required fields are present (album is optional for SLSKD)
 */
export function validateMetadata(artist?: string, title?: string): boolean {
    return !!(
        artist && isMeaningfulMetadata(artist) &&
        title && isMeaningfulMetadata(title)
    );
}

/**
 * Normalize path separators (handle both Windows \ and Unix /)
 */
function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

/**
 * Split path into parts
 */
export function getPathParts(filePath: string): string[] {
    return normalizePath(filePath).split('/')
        .filter(Boolean);
}

/**
 * Get filename from path
 */
export function getFilename(filePath: string): string {
    const parts = getPathParts(filePath);

    return parts.at(-1) || '';
}

/**
 * Get parent folder name from path
 */
export function getParentFolder(filePath: string): string {
    const parts = getPathParts(filePath);

    return parts.at(-2) || '';
}

/**
 * Get grandparent folder name from path
 */
export function getGrandparentFolder(filePath: string): string {
    const parts = getPathParts(filePath);

    return parts.at(-3) || '';
}

/**
 * Clean filename by removing extension, track numbers, and bracket suffixes
 */
export function cleanFilename(filename: string): string {
    let cleaned = removeExtension(filename);
    cleaned = stripBracketSuffix(cleaned);
    cleaned = normalizeDashes(cleaned);
    cleaned = stripTrackNumber(cleaned);

    return normalizeText(cleaned);
}

/**
 * Split "Artist - Title" string, respecting nested brackets/parentheses
 * Based on slsk-batchdl's SplitArtistAndTitle approach
 *
 * Returns null if no valid split found
 */
export function splitArtistTitle(text: string): { artist: string; title: string } | null {
    const normalized = normalizeDashes(text);

    // Find " - " separator, but not inside brackets or parentheses
    let depth = 0;
    let splitIndex = -1;

    for (let i = 0; i < normalized.length - 2; i++) {
        const char = normalized[i];

        if (char === '(' || char === '[' || char === '{') {
            depth++;
        } else if (char === ')' || char === ']' || char === '}') {
            depth = Math.max(0, depth - 1);
        } else if (depth === 0 && normalized.slice(i, i + 3) === ' - ') {
            splitIndex = i;
            break; // Take first valid separator
        }
    }

    if (splitIndex === -1) {
        return null;
    }

    const artist = normalizeText(normalized.slice(0, splitIndex));
    const title = normalizeText(normalized.slice(splitIndex + 3));

    if (!artist || !title) {
        return null;
    }

    return { artist, title };
}

/**
 * Check if a folder name looks like an "Artist - Album" pattern
 */
export function looksLikeArtistAlbumFolder(folderName: string): boolean {
    const parsed = splitArtistTitle(folderName);
    if (!parsed) return false;

    // Both parts should be substantial
    return parsed.artist.length > 1 && parsed.title.length > 1;
}

/**
 * Check if filename contains "Artist - Title" pattern
 */
export function hasArtistTitleInFilename(filename: string): boolean {
    const cleaned = cleanFilename(filename);

    return splitArtistTitle(cleaned) !== null;
}

/**
 * Parse "Artist - Album" from folder name
 */
export function parseArtistAlbumFolder(folderName: string): { artist: string; album: string } | null {
    const parsed = splitArtistTitle(folderName);
    if (!parsed) return null;

    return {
        artist: parsed.artist,
        album: parsed.title // "title" position is the album in folder context
    };
}

/**
 * Extract title from cleaned filename when no artist separator found
 */
export function extractTitleFromFilename(cleanedFilename: string): string {
    // Strip leading dash if present (from track number removal)
    const match = /^-?\s*(.+)$/.exec(cleanedFilename);

    return match?.[1] ? normalizeText(match[1]) : normalizeText(cleanedFilename);
}

/**
 * Check if folder name is generic/invalid for album extraction
 */
export function isGenericFolderName(folderName: string): boolean {
    if (!folderName) return true;

    const lower = folderName.toLowerCase();

    // Check against invalid names
    if (INVALID_FOLDER_NAMES.has(lower)) return true;

    // Looks like a hash/ID
    if (folderName.startsWith('@@')) return true;

    // Just a year
    if (/^\d{4}$/.test(folderName)) return true;

    // Very short
    if (folderName.length < 2) return true;

    return false;
}
