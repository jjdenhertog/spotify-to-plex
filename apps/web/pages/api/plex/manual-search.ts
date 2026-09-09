import { generateError } from '@/helpers/errors/generateError';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import type { PlexTrack } from '@spotify-to-plex/plex-music-search/types/PlexTrack';
import hubSearch from '@spotify-to-plex/plex-music-search/actions/hubSearch';
import getAlbumTracks from '@spotify-to-plex/plex-music-search/actions/getAlbumTracks';
import type { HubSearchResult } from '@spotify-to-plex/plex-music-search/types/actions/HubSearchResult';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const { query } = req.body;

                if (!query?.trim())
                    return res.status(400).json({ message: "Please provide a search query" });

                const settings = await getSettings();

                if (!settings.uri || !settings.token)
                    return res.status(400).json({ message: "No Plex connection found" });

                // Search the Plex library using hub search
                const results = await hubSearch(settings.uri, settings.token, query, 50);

                // Expand album hits into their tracks — Plex's track search index can
                // miss tracks whose album IS indexed (mirrors searchForTrack)
                const albums = results.filter(result => result.type === 'album');

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

                // Filter to only include tracks and convert to PlexTrack format
                const trackResults: PlexTrack[] = results
                    .filter(result => result.type === 'track')
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
                        album: toAlbum(result.album),
                        title: result.title || '',
                        image: result.image || '',
                        src: result.src || '',
                        duration_ms: result.duration_ms
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

function toAlbum(album: any): PlexTrack['album'] {
    if (!album)
        return undefined;

    return {
        id: album.id || '',
        title: album.title || '',
        guid: album.guid || '',
        image: album.image || ''
    };
}
