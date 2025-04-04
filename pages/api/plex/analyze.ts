import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import { PlexMusicSearch, PlexMusicSearchTrack } from '@jjdenhertog/plex-music-search';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';


const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            const searchItem: PlexMusicSearchTrack = req.body.item;
            const { fast = false } = req.body;

            if (!searchItem?.id)
                return res.status(400).json({ msg: "No items given" });

            if (!plex.settings.token || !plex.settings.uri)
                return res.status(400).json({ msg: "Plex not configured" });

            //////////////////////////////////////
            // Initiate the plexMusicSearch
            //////////////////////////////////////
            // Faster searching
            const plexMusicSearch = new PlexMusicSearch({
                uri: plex.settings.uri,
                token: plex.getToken(),
                searchApproaches: fast ? [
                    { id: 'fast', filtered: true }
                ] : undefined
            })

            const searchResponse = await plexMusicSearch.analyze(searchItem)

            res.status(200).json(searchResponse);
        })


export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});
