import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import { PlexMusicSearch, PlexMusicSearchTrack } from '@spotify-to-plex/plex-music-search';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';


const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const searchItem: PlexMusicSearchTrack = req.body.item;
                const { fast = false } = req.body;

                if (!searchItem?.id)
                    return res.status(400).json({ msg: "No items given" });

                const settings = await plex.getSettings();

                if (!settings.token || !settings.uri)
                    return res.status(400).json({ msg: "Plex not configured" });

                //////////////////////////////////////
                // Initiate the plexMusicSearch
                //////////////////////////////////////
                // Faster searching
                const plexMusicSearch = new PlexMusicSearch({
                    uri: settings.uri,
                    token: settings.token,
                    searchApproaches: fast ? [
                        { id: 'fast', filtered: true }
                    ] : undefined
                })

                const searchResponse = await plexMusicSearch.analyze(searchItem)

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
