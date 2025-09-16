import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/cache/getCachedTrackLink';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { search } from '@spotify-to-plex/plex-music-search/functions/search';
import { searchAlbum } from '@spotify-to-plex/plex-music-search/functions/searchAlbum';
import { PlexMusicSearchTrack } from '@spotify-to-plex/plex-music-search/types/PlexMusicSearchTrack';
import { getMusicSearchConfigFromStorage } from "@spotify-to-plex/music-search/functions/getMusicSearchConfigFromStorage";

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
                let musicSearchConfig;
                try {
                    musicSearchConfig = await getMusicSearchConfigFromStorage(getStorageDir());
                } catch (error) {
                    // Fallback to default config if error loading
                    console.warn('Failed to load music search config, using defaults:', error);
                }

                // Get search approaches from config or use explicit defaults
                let searchApproaches;
                if (fast) {
                    searchApproaches = [{ id: 'fast', filtered: true }];
                } else {
                    const defaultApproaches = [
                        { id: 'normal', filtered: false, trim: false },
                        { id: 'filtered', filtered: true, trim: false, removeQuotes: true },
                        { id: 'trimmed', filtered: false, trim: true },
                        { id: 'filtered_trimmed', filtered: true, trim: true, removeQuotes: true }
                    ];
                    searchApproaches = (musicSearchConfig?.searchApproaches?.plex || defaultApproaches)
                        .map(approach => ({ ...approach }));
                }

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
