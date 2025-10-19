import { generateError } from '@/helpers/errors/generateError';
import { getSlskdSettings } from '@spotify-to-plex/plex-config/functions/getSlskdSettings';
import { searchSlskdTrack } from '@spotify-to-plex/shared-utils/slskd/searchSlskdTrack';
import { waitForSearchComplete } from '@spotify-to-plex/shared-utils/slskd/waitForSearchComplete';
import { getSearchResults } from '@spotify-to-plex/shared-utils/slskd/getSearchResults';
import { collectFiles } from '@spotify-to-plex/shared-utils/slskd/collectFiles';
import { filterFiles } from '@spotify-to-plex/shared-utils/slskd/filterFiles';
import { queueDownload } from '@spotify-to-plex/shared-utils/slskd/queueDownload';
import { deleteSearch } from '@spotify-to-plex/shared-utils/slskd/deleteSearch';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

type SendTrackRequest = {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
};

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        try {
            // Validate input
            const { id, title, artist, album, duration } = req.body as SendTrackRequest;

            if (!id || !title || !artist) {
                return res.status(400).json({
                    error: 'Missing required fields: id, title, artist'
                });
            }

            // Get settings
            const settings = await getSlskdSettings();

            if (!settings.enabled) {
                return res.status(400).json({ error: 'SLSKD is not enabled' });
            }

            if (!settings.url) {
                return res.status(400).json({ error: 'SLSKD URL is not configured' });
            }

            if (!process.env.SLSKD_API_KEY) {
                return res.status(400).json({ error: 'SLSKD API key is not configured' });
            }

            const apiKey = process.env.SLSKD_API_KEY;

            // Build track info object
            const trackInfo = {
                artist,
                title,
                album: album || '',
                duration: duration || 0
            };

            const searchQuery = `${artist} - ${title}`;
            console.log(`[SLSKD] Searching for track: ${searchQuery}`);

            // Step 1: Create search
            let searchId: string;
            try {
                searchId = await searchSlskdTrack(trackInfo, settings.url, apiKey);
                console.log(`[SLSKD] Search created with ID: ${searchId}`);
            } catch (error) {
                console.error('[SLSKD] Failed to create search:', error);

                return res.status(500).json({
                    error: `Failed to create search: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }

            const cleanupSearch = true;

            try {
                // Step 2: Wait for search to complete
                console.log(`[SLSKD] Waiting for search to complete...`);
                const searchCompleted = await waitForSearchComplete(
                    searchId,
                    searchQuery,
                    settings.url,
                    apiKey,
                    settings.retry_limit,
                    0,
                    settings.search_timeout * 1000 // Convert to milliseconds
                );

                if (!searchCompleted.completed) {
                    console.log(`[SLSKD] Search timed out or failed`);

                    return res.status(404).json({
                        error: 'Search did not complete in time'
                    });
                }

                if (searchCompleted.fileCount === 0) {
                    console.log(`[SLSKD] No files found for: ${searchQuery}`);

                    return res.status(404).json({
                        error: 'No files found for this track'
                    });
                }

                console.log(`[SLSKD] Search completed with ${searchCompleted.fileCount} files`);

                // Step 3: Get search results
                const searchResults = await getSearchResults(searchId, settings.url, apiKey);
                console.log(`[SLSKD] Retrieved ${searchResults.length} search results`);

                // Step 4: Collect matching files
                const collectedFiles = collectFiles(
                    trackInfo,
                    searchResults,
                    settings.allowed_extensions
                    // settings.max_length_difference // TODO: Re-enable when Track type includes duration_ms
                );

                if (collectedFiles.length === 0) {
                    console.log(`[SLSKD] No matching files after collection`);

                    return res.status(404).json({
                        error: 'No files matched the quality criteria'
                    });
                }

                console.log(`[SLSKD] Collected ${collectedFiles.length} matching files`);

                // Step 5: Filter files by quality
                const filteredFiles = filterFiles(
                    collectedFiles,
                    settings.allowed_extensions,
                    settings.min_bitrate,
                    settings.min_bitdepth,
                    settings.download_attempts
                );

                if (filteredFiles.length === 0) {
                    console.log(`[SLSKD] No files passed quality filter`);

                    return res.status(404).json({
                        error: 'No files met the quality requirements'
                    });
                }

                console.log(`[SLSKD] Filtered to ${filteredFiles.length} high-quality files`);

                // Step 6: Queue downloads (try all filtered files until one succeeds)
                let queuedFile: typeof filteredFiles[0] | undefined;

                try {
                    queuedFile = await queueDownload(filteredFiles, settings.url, apiKey);
                    console.log(`[SLSKD] Successfully queued download: ${queuedFile.filename}`);
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`[SLSKD] Failed to queue any files:`, error);

                    return res.status(500).json({
                        error: `Failed to queue any downloads. ${errorMsg}`
                    });
                }

                // Success response
                return res.status(200).json({
                    success: true,
                    message: 'Track queued for download',
                    track: {
                        title,
                        artist,
                        album
                    },
                    file: {
                        filename: queuedFile.filename,
                        username: queuedFile.username,
                        size: queuedFile.size,
                        bitRate: queuedFile.bitRate,
                        bitDepth: queuedFile.bitDepth,
                        extension: queuedFile.extension
                    }
                });

            } finally {
                // Step 7: Cleanup - delete search
                if (cleanupSearch) {
                    try {
                        await deleteSearch(searchId, settings.url, apiKey);
                        console.log(`[SLSKD] Deleted search ${searchId}`);
                    } catch (error) {
                        // Ignore cleanup errors
                        console.warn(`[SLSKD] Failed to delete search ${searchId}:`, error);
                    }
                }
            }

        } catch (error) {
            console.error('[SLSKD] Unexpected error in send-track:', error);
            res.status(500).json({
                error: `Failed to send track to SLSKD: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Send Track", err);
    }
});
