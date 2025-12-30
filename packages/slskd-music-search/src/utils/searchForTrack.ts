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
 * Sanitize search query by removing/replacing problematic special characters.
 *
 * Soulseek/SLSKD has issues with certain characters:
 * - `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `+`, `=` cause search failures
 * - `-` at start of word means "exclude" (we preserve mid-word hyphens)
 * - `"` and `'` can cause issues
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
    return query
        // Smart substitutions for common special char letter replacements in artist names
        .replace(/!/g, 'i')      // P!nk -> Pink
        .replace(/\$/g, 's')     // Ke$ha -> Kesha
        .replace(/@/g, 'a')      // @liya -> Aliya
        // Remove other characters that break SLSKD searches
        .replace(/[#%&*+<=>[\\\]^`{|}~]/g, '')
        // Replace curly/smart quotes with nothing
        .replace(/["']/g, '')
        // Remove straight quotes
        .replace(/["']/g, '')
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Remove leading hyphens from words (exclusion syntax)
        .replace(/\s-+/g, ' ')
        .replace(/^-+/, '')
        .trim();
}

/**
 * Execute SLSKD search for a track with metadata extraction
 */
export async function searchForTrack(
    artist: string,
    title: string,
    album: string
) {
    const state = getState();
    if (!state.credentials) {
        throw new Error('Credentials not initialized. Call setState first.');
    }

    if (!state.config) {
        throw new Error('Config not initialized. Call setState first.');
    }

    // Build search query with sanitization for SLSKD special characters
    const queryParts = [artist, title];
    if (album) {
        queryParts.push(album);
    }

    const rawQuery = queryParts.join(' ').trim();
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
                extension: file.extension,
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
