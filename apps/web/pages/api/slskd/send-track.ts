import { generateError } from '@/helpers/errors/generateError';
import { search } from '@spotify-to-plex/slskd-music-search/functions/search';
import { queueDownload } from '@spotify-to-plex/slskd-music-search/actions/queueDownload';
import type { SlskdMusicSearchTrack } from '@spotify-to-plex/slskd-music-search';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { getSlskdSettings } from '@spotify-to-plex/plex-config/functions/getSlskdSettings';
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
            const { id, title, artist, album } = req.body as SendTrackRequest;

            if (!id || !title || !artist) {
                return res.status(400).json({
                    error: 'Missing required fields: id, title, artist'
                });
            }

            // Validate environment variables
            if (typeof process.env.SLSKD_API_KEY !== 'string') {
                return res.status(400).json({ error: 'Environment variable SLSKD_API_KEY is missing' });
            }

            const slskdSettings = await getSlskdSettings();
            if (!slskdSettings.url) {
                return res.status(400).json({ error: 'SLSKD URL is not configured in settings. Please save your settings first.' });
            }

            // Sanitize URL (remove trailing slash to prevent double-slash issues)
            const baseUrl = slskdSettings.url.endsWith('/')
                ? slskdSettings.url.slice(0, -1)
                : slskdSettings.url;

            console.log(`[SLSKD] Searching for track: ${artist} - ${title}`);

            // Load music search configuration
            const musicSearchConfig = await getMusicSearchConfig();

            const slskdConfig = {
                baseUrl,
                apiKey: process.env.SLSKD_API_KEY,
                musicSearchConfig,
                searchApproaches: musicSearchConfig.searchApproaches,
                textProcessing: musicSearchConfig.textProcessing,
                // Apply user settings for search behavior
                searchTimeout: slskdSettings.search_timeout * 1000, // Convert seconds to milliseconds
                maxResultsPerApproach: slskdSettings.max_results,
                // Filter results by allowed file extensions
                allowedExtensions: slskdSettings.allowed_extensions
            };

            // Build track search request
            const searchTrack: SlskdMusicSearchTrack = {
                id,
                artists: [artist],
                title,
                album
            };

            // Perform search using new package
            const searchResponse = await search(slskdConfig, [searchTrack]);

            if (!searchResponse || searchResponse.length === 0) {
                console.log(`[SLSKD] No search results returned`);

                return res.status(404).json({
                    error: 'Search did not return any results'
                });
            }

            const [result] = searchResponse;

            if (!result?.result || result.result.length === 0) {
                console.log(`[SLSKD] No files found for: ${artist} - ${title}`);

                return res.status(404).json({
                    error: 'No files found for this track',
                    details: {
                        queriesAttempted: result?.queries?.length || 0,
                        approaches: result?.queries?.map(q => q.approach).filter((v, i, a) => a.indexOf(v) === i) || []
                    }
                });
            }

            // Get the best match (first result)
            const [bestMatch] = result.result;
            if (!bestMatch) {
                return res.status(404).json({
                    error: 'No best match found'
                });
            }

            console.log(`[SLSKD] Found ${result.result.length} matches. Best match: ${bestMatch.filename}`);

            // Queue the download
            try {
                await queueDownload(
                    [{
                        username: bestMatch.username,
                        filename: bestMatch.filename,
                        size: bestMatch.size
                    }],
                    { baseUrl, apiKey: process.env.SLSKD_API_KEY }
                );
                console.log(`[SLSKD] Successfully queued download: ${bestMatch.filename}`);
            } catch (queueError) {
                console.error(`[SLSKD] Failed to queue download:`, queueError);

                return res.status(500).json({
                    error: `Found track but failed to queue download: ${queueError instanceof Error ? queueError.message : 'Unknown error'}`,
                    bestMatch: {
                        filename: bestMatch.filename,
                        username: bestMatch.username
                    }
                });
            }

            // Build metadata response if available
            let metadataResponse;
            if (bestMatch.metadata) {
                metadataResponse = {
                    extractedArtist: bestMatch.metadata.artist,
                    extractedTitle: bestMatch.metadata.title,
                    extractedAlbum: bestMatch.metadata.album
                };
            }

            // Success response with detailed metadata
            return res.status(200).json({
                success: true,
                message: 'Track queued for download',
                track: {
                    title,
                    artist,
                    album
                },
                bestMatch: {
                    filename: bestMatch.filename,
                    username: bestMatch.username
                },
                metadata: metadataResponse,
                matchInfo: {
                    totalMatches: result.result.length,
                    queriesAttempted: result.queries?.length || 0,
                    approaches: result.queries?.map(q => q.approach).filter((v, i, a) => a.indexOf(v) === i) || []
                }
            });

        } catch (error) {
            console.error('[SLSKD] Unexpected error in send-track:', error);
            res.status(500).json({
                error: `Failed to search track in SLSKD: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Send Track", err);
    }
});
