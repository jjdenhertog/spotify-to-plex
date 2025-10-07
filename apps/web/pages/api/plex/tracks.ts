import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/cache/getCachedTrackLink';
import { search } from '@spotify-to-plex/plex-music-search/functions/search';
import { searchAlbum } from '@spotify-to-plex/plex-music-search/functions/searchAlbum';
import { PlexMusicSearchTrack } from '@spotify-to-plex/plex-music-search/types/PlexMusicSearchTrack';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";

import { SearchResponse } from '@spotify-to-plex/plex-music-search/types/SearchResponse';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const searchItems: PlexMusicSearchTrack[] = req.body.items;
                const { type = 'spotify-playlist', fast = false, album } = req.body;

                if (!searchItems || searchItems.length === 0)
                    return res.status(400).json({ msg: "No items given" });

                const settings = await getSettings();
                if (!settings.token || !settings.uri)
                    return res.status(400).json({ msg: "Plex not configured" });

                //////////////////////////////////////
                // Load music search configuration and search
                //////////////////////////////////////
                const musicSearchConfig = await getMusicSearchConfig();
                if (!musicSearchConfig)
                    return res.status(400).json({ msg: "Music search config not found" });

                // Get search approaches from config or use explicit defaults
                let {searchApproaches} = musicSearchConfig;
                if(!searchApproaches || searchApproaches.length === 0)
                    return res.status(400).json({ msg: "Search approaches not found" });

                const [firstApproach] = searchApproaches
                if(fast && firstApproach)
                    searchApproaches = [firstApproach];

                const plexConfig = {
                    uri: settings.uri,
                    token: settings.token,
                    musicSearchConfig,
                    searchApproaches
                };

                let searchResult: SearchResponse[] = []
                switch (type) {
                    case "spotify-album":
                        searchResult = await searchAlbum(plexConfig, searchItems)
                        break;

                    default:
                        searchResult = await search(plexConfig, searchItems)
                        break;
                }

                ///////////////////////////
                // Update track links
                ///////////////////////////
                const { add } = getCachedTrackLinks(searchItems, 'plex')
                add(searchResult, 'plex', album ? { id: album } : undefined)

                res.status(200).json(searchResult);
            } catch (error) {
                console.error('Error searching Plex tracks:', error);
                res.status(500).json({ error: 'Failed to search tracks' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});
