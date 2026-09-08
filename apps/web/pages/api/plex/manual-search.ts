import { generateError } from '@/helpers/errors/generateError';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';
import hubSearch from '@spotify-to-plex/plex-music-search/actions/hubSearch';
import getAlbumTracks from '@spotify-to-plex/plex-music-search/actions/getAlbumTracks';

import type { HubSearchResult } from '@spotify-to-plex/plex-music-search/types/actions/HubSearchResult';
import type { PlexTrack } from '@spotify-to-plex/plex-music-search/types/PlexTrack';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            const { query } = req.body;

            if (typeof query !== 'string' || !query.trim())
                return res.status(400).json({ error: "Please provide a search query" });

            const settings = await getSettings();
            if (!settings.uri || !settings.token)
                return res.status(400).json({ error: "No Plex connection found" });

            try {
                const results = await hubSearch(settings.uri, settings.token, query, 50);

                // The tracks needing a manual fix are often the ones plex's track
                // index cannot see, which is why the automatic match failed
                const albums = results.filter(item => item.type === 'album');

                for (const album of albums.slice(0, 5)) {
                    try {
                        const albumTracks: HubSearchResult[] = await getAlbumTracks(settings.uri, settings.token, album.id);
                        albumTracks.forEach(item => {
                            if (!results.some(existingItem => existingItem.guid === item.guid))
                                results.push(item);
                        });
                    } catch (_e) {
                        // Ignore albums that fail to load
                    }
                }

                const tracks: PlexTrack[] = results
                    .filter(item => item.type === 'track')
                    .map(item => ({ ...item, src: item.src || '' }));

                return res.json(tracks);
            } catch (error) {
                console.error('Error searching Plex library:', error);

                return res.status(500).json({ error: 'Failed to search the Plex library' });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Manual search", err);
    }
});
