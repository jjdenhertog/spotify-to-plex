import { generateError } from '@/helpers/errors/generateError';
import { analyze } from '@spotify-to-plex/slskd-music-search/functions/analyze';
import { SlskdMusicSearchTrack } from '@spotify-to-plex/slskd-music-search/types/track';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { getSlskdSettings } from '@spotify-to-plex/plex-config/functions/getSlskdSettings';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';


const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const searchItem: SlskdMusicSearchTrack = req.body.item;

                if (!searchItem?.id)
                    return res.status(400).json({ msg: "No items given" });

                if (typeof process.env.SLSKD_API_KEY !== 'string')
                    return res.status(400).json({ msg: "Environment variable SLSKD_API_KEY is missing" });

                const slskdSettings = await getSlskdSettings();
                if (!slskdSettings.url)
                    return res.status(400).json({ msg: "SLSKD URL is not configured in settings. Please save your settings first." });

                // Sanitize URL (remove trailing slash to prevent double-slash issues)
                const baseUrl = slskdSettings.url.endsWith('/')
                    ? slskdSettings.url.slice(0, -1)
                    : slskdSettings.url;

                //////////////////////////////////////
                // Load music search configuration and analyze
                //////////////////////////////////////
                const musicSearchConfig = await getMusicSearchConfig();

                const slskdConfig = {
                    baseUrl,
                    apiKey: process.env.SLSKD_API_KEY,
                    musicSearchConfig,
                    searchApproaches: musicSearchConfig.searchApproaches,
                    textProcessing: musicSearchConfig.textProcessing,
                    // Apply user settings for search behavior
                    searchTimeout: slskdSettings.search_timeout * 1000, // Convert seconds to milliseconds
                    maxResultsPerApproach: slskdSettings.max_results
                };

                const searchResponse = await analyze(slskdConfig, [searchItem])

                // Return first result (matching Plex analyze format which returns single SearchResponse)
                const result = searchResponse[0] || {
                    id: searchItem.id,
                    artist: searchItem.artists[0] || '',
                    title: searchItem.title,
                    album: searchItem.album || '',
                    queries: [],
                    result: []
                };

                console.log('[SLSKD Analyze] Returning result:', {
                    id: result.id,
                    queriesCount: result.queries?.length || 0,
                    resultsCount: result.result?.length || 0
                });

                res.status(200).json(result);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                res.status(500).json({ error: `Failed to analyze music: ${errorMessage}` });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Analyze", err);
    }
});
