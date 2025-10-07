import { generateError } from '@/helpers/errors/generateError';
import { analyze } from '@spotify-to-plex/plex-music-search/functions/analyze';
import { PlexMusicSearchTrack } from '@spotify-to-plex/plex-music-search/types/PlexMusicSearchTrack';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';


const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const searchItem: PlexMusicSearchTrack = req.body.item;

                if (!searchItem?.id)
                    return res.status(400).json({ msg: "No items given" });

                const settings = await getSettings();

                if (!settings.token || !settings.uri)
                    return res.status(400).json({ msg: "Plex not configured" });

                //////////////////////////////////////
                // Load music search configuration and analyze
                //////////////////////////////////////
                const musicSearchConfig = await getMusicSearchConfig();

                const plexConfig = {
                    uri: settings.uri,
                    token: settings.token,
                    musicSearchConfig,
                    searchApproaches: musicSearchConfig.searchApproaches
                };

                const searchResponse = await analyze(plexConfig, searchItem)

                res.status(200).json(searchResponse);
            } catch (error) {
                console.error('Error analyzing Plex music:', error);
                res.status(500).json({ error: 'Failed to analyze music' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});
