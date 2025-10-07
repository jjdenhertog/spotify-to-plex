import { generateError } from '@/helpers/errors/generateError';
import { analyze } from '@spotify-to-plex/tidal-music-search/functions/analyze';
import { TidalMusicSearchTrack } from '@spotify-to-plex/tidal-music-search/types/TidalMusicSearchTrack';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';


const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const searchItem: TidalMusicSearchTrack = req.body.item;

                if (!searchItem?.id)
                    return res.status(400).json({ msg: "No items given" });

                if (typeof process.env.TIDAL_API_CLIENT_ID !== 'string')
                    return res.status(400).json({ msg: "Environment variable TIDAL_API_CLIENT_ID is missing" });

                if (typeof process.env.TIDAL_API_CLIENT_SECRET !== 'string')
                    return res.status(400).json({ msg: "Environment variable TIDAL_API_CLIENT_SECRET is missing" });

                //////////////////////////////////////
                // Load music search configuration and analyze
                //////////////////////////////////////
                const musicSearchConfig = await getMusicSearchConfig();

                const tidalConfig = {
                    clientId: process.env.TIDAL_API_CLIENT_ID,
                    clientSecret: process.env.TIDAL_API_CLIENT_SECRET,
                    musicSearchConfig,
                    searchApproaches: musicSearchConfig.searchApproaches
                };

                const searchResponse = await analyze(tidalConfig, searchItem)

                res.status(200).json(searchResponse);
            } catch (_error) {
                res.status(500).json({ error: 'Failed to analyze music' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});