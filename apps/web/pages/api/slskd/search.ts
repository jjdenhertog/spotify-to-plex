import { generateError } from '@/helpers/errors/generateError';
import { search } from '@spotify-to-plex/slskd-music-search/functions/search';
import { SlskdMusicSearchTrack } from '@spotify-to-plex/slskd-music-search/types/SlskdMusicSearchTrack';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { getSlskdSettings } from '@spotify-to-plex/plex-config/functions/getSlskdSettings';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';


const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const searchItems: SlskdMusicSearchTrack[] = req.body.items;

                if (!Array.isArray(searchItems) || searchItems.length === 0)
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
                // Load music search configuration and search
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
                    maxResultsPerApproach: slskdSettings.max_results,
                    allowedExtensions: slskdSettings.allowed_extensions
                };

                const searchResponse = await search(slskdConfig, searchItems);

                res.status(200).json(searchResponse);
            } catch (_error) {
                res.status(500).json({ error: 'Failed to search music' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Search", err);
    }
});
