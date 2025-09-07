import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/cache/getCachedTrackLink';
// MIGRATED: Updated to use shared utils package
import { plex } from '@/library/plex';
import { settingsDir } from '@spotify-to-plex/shared-utils/utils/settingsDir';
import { search } from '@spotify-to-plex/plex-music-search/functions/search';
import { searchAlbum } from '@spotify-to-plex/plex-music-search/functions/searchAlbum';
import { PlexMusicSearchTrack } from '@spotify-to-plex/plex-music-search/types/PlexMusicSearchTrack';
import { getMusicSearchConfigFromStorage } from "@spotify-to-plex/music-search/functions/getMusicSearchConfigFromStorage";

import { SearchResponse } from '@spotify-to-plex/plex-music-search/types/SearchResponse';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const searchItems: PlexMusicSearchTrack[] = req.body.items;
                const { type = 'spotify-playlist', fast = false, album } = req.body;

                if (!searchItems || searchItems.length === 0)
                    return res.status(400).json({ msg: "No items given" });

                const settings = await plex.getSettings();

                if (!settings.token || !settings.uri)
                    return res.status(400).json({ msg: "Plex not configured" });

                //////////////////////////////////////
                // Load music search configuration and search
                //////////////////////////////////////
                let musicSearchConfig;
                try {
                    musicSearchConfig = await getMusicSearchConfigFromStorage(settingsDir);
                } catch (_error) {
                    // Fallback to default config if error loading
                    // Failed to load music search config, using defaults - this is expected fallback behavior
                }

                const plexConfig = {
                    uri: settings.uri,
                    token: settings.token,
                    musicSearchConfig,
                    searchApproaches: fast ? [
                        { id: 'fast', filtered: true }
                    ] : undefined
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
                const { add } = getCachedTrackLinks(searchItems, 'plex', settingsDir)
                add(searchResult, 'plex', album ? { id: album } : undefined)

                res.status(200).json(searchResult);
            } catch (_error) {
                // Error searching Plex tracks - handled by Next.js error boundary
                res.status(500).json({ error: 'Failed to search tracks' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});
