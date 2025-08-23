import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/server';
import { plex } from '@/library/plex';
import { settingsDir } from '@/library/settingsDir';
import { PlexMusicSearch, PlexMusicSearchTrack, PlexTrack } from '@spotify-to-plex/plex-music-search';

type SearchResponse = any;
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';


const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            const searchItems: PlexMusicSearchTrack[] = req.body.items;

            if (!plex.settings.token || !plex.settings.uri)
                return res.status(400).json({ msg: "Plex not configured" });

            if (!Array.isArray(searchItems))
                return res.status(200).json([]);

            //////////////////////////////////////
            // Initiate the plexMusicSearch
            //////////////////////////////////////
            const plexMusicSearch = new PlexMusicSearch({
                uri: plex.settings.uri,
                token: plex.settings.token
            })

            //////////////////////////////////////
            // Handeling cached links
            //////////////////////////////////////
            const { found: cachedTrackLinks } = getCachedTrackLinks(searchItems, 'plex', settingsDir)

            const result: SearchResponse[] = []

            for (let i = 0; i < searchItems.length; i++) {
                const searchItem = searchItems[i];
                if (!searchItem) continue;

                // Process if no cached link has been found
                const trackLink = cachedTrackLinks.find(item => item.spotify_id == searchItem.id)
                if (!trackLink?.plex_id || trackLink.plex_id?.length == 0)
                    continue;

                // Load the plex tracks data
                const foundTracks: PlexTrack[] = []

                for (let j = 0; j < trackLink.plex_id.length; j++) {
                    const plexId = trackLink.plex_id[j]
                    if (!plexId) continue;

                    try {
                        const metaData = await plexMusicSearch.getById(plexId)

                         
                        if (metaData)
                            foundTracks.push(metaData)

                    } catch (_e) {
                    }
                }

                // Try searching again if no tracks are found
                if (foundTracks.length == 0)
                    continue;

                // Add the result
                result.push({
                    id: searchItem.id,
                    title: searchItem.title,
                    artist: searchItem.artists?.[0] || '',
                    album: searchItem.album || "",
                    result: foundTracks
                })

            }

            res.status(200).json(result);
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        console.log(err)
        generateError(req, res, "Songs", err);
    }
});
