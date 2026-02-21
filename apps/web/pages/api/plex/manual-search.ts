import { generateError } from '@/helpers/errors/generateError';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import type { PlexTrack } from '@spotify-to-plex/plex-music-search/types/PlexTrack';
import hubSearch from '@spotify-to-plex/plex-music-search/actions/hubSearch';
import type { HubSearchResult } from '@spotify-to-plex/plex-music-search/types/actions/HubSearchResult';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const { query, trackTitle, albumTitle } = req.body;

                const searchQuery = (query || trackTitle || albumTitle || '').trim();

                if (!searchQuery)
                    return res.status(400).json({ message: "Please provide a search query" });

                const settings = await getSettings();

                if (!settings.uri || !settings.token)
                    return res.status(400).json({ message: "No Plex connection found" });

                // Search the Plex library using hub search
                const results = await hubSearch(settings.uri, settings.token, searchQuery, 50);

                // Filter to only include tracks and convert to PlexTrack format
                const normalizedQuery = searchQuery.toLowerCase();
                const normalizedAlbumTitle = (albumTitle || '').toLowerCase();

                const trackResults: PlexTrack[] = results
                    .filter(result => result.type === 'track')
                    .filter((result: any) => {
                        const title = (result.title || '').toLowerCase();
                        const album = (result.album?.title || '').toLowerCase();

                        const titleMatch = normalizedQuery ? title.includes(normalizedQuery) : false;
                        const albumMatch = normalizedQuery ? album.includes(normalizedQuery) : false;
                        const explicitAlbumMatch = normalizedAlbumTitle ? album.includes(normalizedAlbumTitle) : false;

                        return titleMatch || albumMatch || explicitAlbumMatch;
                    })
                    .map((result: any) => ({
                        guid: result.guid || '',
                        id: result.id || result.ratingKey || '',
                        source: result.src || '',
                        artist: {
                            id: result.artist?.id || '',
                            title: result.artist?.title || '',
                            guid: result.artist?.guid || '',
                            image: result.artist?.image || ''
                        },
                        album: result.album ? {
                            id: result.album.id || '',
                            title: result.album.title || '',
                            guid: result.album.guid || '',
                            image: result.album.image || ''
                        } : undefined,
                        title: result.title || '',
                        image: result.image || '',
                        src: result.src || ''
                    }));

                return res.json(trackResults);
            } catch (error) {
                console.error('Error performing manual Plex search:', error);

                return res.status(500).json({ message: "Something went wrong while searching the Plex library." })
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Manual Search", err);
    }
});
