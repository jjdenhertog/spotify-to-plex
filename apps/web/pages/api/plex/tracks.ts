import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/server';
// MIGRATED: Updated to use shared utils package
import { plex } from '@/library/plex';
import { settingsDir } from '@/library/settingsDir';
import { PlexMusicSearch, PlexMusicSearchTrack } from '@spotify-to-plex/plex-music-search';

type SearchResponse = any;
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            const searchItems: PlexMusicSearchTrack[] = req.body.items;
            const { type = 'spotify-playlist', fast = false, album } = req.body;

            if (!searchItems || searchItems.length == 0)
                return res.status(400).json({ msg: "No items given" });

            if (!plex.settings.token || !plex.settings.uri)
                return res.status(400).json({ msg: "Plex not configured" });

            //////////////////////////////////////
            // Initiate the plexMusicSearch
            //////////////////////////////////////
            const plexMusicSearch = new PlexMusicSearch({
                uri: plex.settings.uri,
                token: plex.settings.token,
                searchApproaches: fast ? [
                    { id: 'fast', filtered: true }
                ] : undefined
            })

            let searchResult: SearchResponse[] = []
            switch (type) {
                case "spotify-album":
                    searchResult = await plexMusicSearch.searchAlbum(searchItems)
                    break;

                default:
                    searchResult = await plexMusicSearch.search(searchItems)
                    break;
            }

            ///////////////////////////
            // Update track links
            ///////////////////////////
            const { add } = getCachedTrackLinks(searchItems, 'plex', settingsDir)
            add(searchResult, 'plex', album ? { id: album } : undefined)

            res.status(200).json(searchResult);
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});
