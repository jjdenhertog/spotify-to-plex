import type { SlskdTrack } from "../types/SlskdTrack";
import { getState } from '../session/state';
import { submitSearch, waitForSearch, cancelSearch } from '../actions/api';
import { extractMetadata } from './extractMetadata';

// Query cache to avoid duplicate SLSKD searches within a session
const queryCache = new Map<string, SlskdTrack[]>();

/**
 * Clear the query cache (call this at start of new search session)
 */
export function clearSearchCache() {
    queryCache.clear();
}

/**
 * Normalize accented/unicode characters to ASCII equivalents.
 * This helps match files that may have non-accented versions of names.
 */
function normalizeAccents(str: string): string {
    // Common accent mappings
    const accentMap: Record<string, string> = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
        'ç': 'c', 'č': 'c', 'ć': 'c',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ě': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ñ': 'n', 'ń': 'n',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'œ': 'oe',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ý': 'y', 'ÿ': 'y',
        'ž': 'z', 'ź': 'z', 'ż': 'z',
        'ß': 'ss',
        'đ': 'd', 'ð': 'd',
        'þ': 'th',
        'ł': 'l',
        'ș': 's', 'ş': 's',
        'ț': 't', 'ţ': 't',
    };

    return str.replace(/[àáâãäåæçčćèéêëěìíîïñńòóôõöøœùúûüýÿžźżßđðþłșşțţ]/gi, (char) => {
        const lower = char.toLowerCase();
        const replacement = accentMap[lower];
        if (!replacement) return char;
        // Preserve case for first letter
        return char === lower ? replacement : replacement.charAt(0).toUpperCase() + replacement.slice(1);
    });
}

/**
 * Sanitize search query by removing/replacing problematic special characters.
 *
 * Soulseek/SLSKD has issues with certain characters:
 * - `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `+`, `=` cause search failures
 * - `-` at start of word means "exclude" (we preserve mid-word hyphens)
 * - `"` and `'` can cause issues
 * - `()` parentheses can cause search issues
 * - Unicode/accented characters may not match
 *
 * Common artist name substitutions:
 * - P!nk -> Pink (! often replaces 'i')
 * - Ke$ha -> Kesha ($ often replaces 's')
 * - @liya -> Aliya (@ often replaces 'a')
 *
 * @see https://github.com/mrusse/soularr/issues/26
 */
function sanitizeSearchQuery(query: string) {
    let result = query
        // Smart substitutions for common special char letter replacements in artist names
        .replace(/!/g, 'i')      // P!nk -> Pink
        .replace(/\$/g, 's')     // Ke$ha -> Kesha
        .replace(/@/g, 'a')      // @liya -> Aliya
        // Remove parentheses (but keep content) - they can break SLSKD searches
        .replace(/[()[\]]/g, ' ')
        // Remove other characters that break SLSKD searches
        .replace(/[#%&*+<=>\\^`{|}~]/g, '')
        // Replace apostrophes/quotes with space (allows word-based matching)
        // "Cherlene's" -> "Cherlene s" matches both "Cherlene's" and "Cherlenes"
        .replace(/["'''""]/g, ' ')
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Remove leading hyphens from words (exclusion syntax)
        .replace(/\s-+/g, ' ')
        .replace(/^-+/, '')
        .trim();

    // Normalize accented characters to ASCII equivalents
    result = normalizeAccents(result);

    return result;
}

/**
 * Extract file extension from filename
 */
function extractExtensionFromFilename(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filename.length - 1) {
        return '';
    }
    return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Execute SLSKD search for a track with metadata extraction
 */
export async function searchForTrack(
    artist: string,
    title: string,
    _album: string
) {
    const state = getState();
    if (!state.credentials) {
        throw new Error('Credentials not initialized. Call setState first.');
    }

    if (!state.config) {
        throw new Error('Config not initialized. Call setState first.');
    }

    // Build search query with artist + title only (like plex-music-search)
    // Album is not included in search - it's used for matching/filtering results
    const rawQuery = `${artist} ${title}`.trim();
    const query = sanitizeSearchQuery(rawQuery);

    if (!query) {
        return [];
    }

    // Log if sanitization changed the query
    if (query !== rawQuery) {
        console.log(`[searchForTrack] Sanitized query: "${rawQuery}" -> "${query}"`);
    }

    // Check cache first to avoid duplicate searches
    const cacheKey = query.toLowerCase();
    if (queryCache.has(cacheKey)) {
        console.log(`[searchForTrack] Using cached results for: "${query}"`);

        return queryCache.get(cacheKey)!;
    }

    let searchId: string | undefined;

    try {
        // Submit search to SLSKD
        searchId = await submitSearch(state.credentials, {
            query,
            limit: state.config.maxResultsPerApproach || 100,
            timeout: state.config.searchTimeout || 30_000
        });

        if (!searchId) {
            console.error('[searchForTrack] Failed to get search ID');

            return [];
        }

        // Wait for completion
        const response = await waitForSearch(state.credentials, searchId);

        console.log(`[searchForTrack] Processing ${response.files.length} files for query: "${query}"`);

        // Process results with metadata extraction
        const results: SlskdTrack[] = [];
        let skippedLocked = 0;

        for (const file of response.files) {
            // Skip locked files
            if (file.isLocked) {
                skippedLocked++;
                continue;
            }

            // Extract metadata from filename
            const extraction = extractMetadata(file.filename);
            const meta = extraction.success ? extraction.metadata : undefined;
            const extractedArtist = meta?.artist ?? '';
            const extractedTitle = meta?.title ?? '';
            const extractedAlbum = meta?.album ?? '';

            // Extract extension from filename if not provided by API
            const fileExtension = file.extension || extractExtensionFromFilename(file.filename);

            // Create track result with Plex-compatible format
            const track: SlskdTrack = {
                id: file.filename, // Use filename as unique identifier
                title: extractedTitle,
                artist: {
                    id: extractedArtist.toLowerCase().replace(/\s+/g, '-'),
                    title: extractedArtist
                },
                album: extractedAlbum ? {
                    id: extractedAlbum.toLowerCase().replace(/\s+/g, '-'),
                    title: extractedAlbum
                } : undefined,
                src: file.filename, // Source path for UI display (Plex-compatible)
                username: file.username,
                filename: file.filename,
                size: file.size,
                extension: fileExtension,
                bitRate: file.bitRate,
                sampleRate: file.sampleRate,
                bitDepth: file.bitDepth,
                length: file.length,
                isLocked: file.isLocked,
                metadata: meta
            };

            results.push(track);
        }

        // Log metadata extraction stats
        const withMetadata = results.filter(r => r.metadata);
        console.log(
            `[searchForTrack] Metadata extraction: ${withMetadata.length}/${results.length} successful`
        );
        if (withMetadata.length > 0) {
            console.log(`[searchForTrack] Sample metadata:`);
            withMetadata.slice(0, 3).forEach((r, i) => {
                console.log(`  ${i + 1}. "${r.metadata?.artist}" - "${r.metadata?.title}" [${r.metadata?.pattern}]`);
            });
        }

        console.log(
            `[searchForTrack] Results: ${results.length} passed, skipped: ${skippedLocked} locked`
        );

        // Cache the results
        queryCache.set(cacheKey, results);

        // Cleanup search
        try {
            await cancelSearch(state.credentials, searchId);
        } catch {
            // Ignore cleanup errors
        }

        return results;
    } catch (error) {
        console.error('[searchForTrack] Search failed:', error);

        // Try to cleanup on error
        if (searchId) {
            try {
                await cancelSearch(state.credentials, searchId);
            } catch {
                // Ignore cleanup errors
            }
        }

        return [];
    }
}
