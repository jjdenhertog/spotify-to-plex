import { generateError } from '@/helpers/errors/generateError';
import getCachedTrackLinks from '@/helpers/getCachedTrackLink';
import { plex } from '@/library/plex';
import { PlexMusicSearch, PlexMusicSearchTrack, PlexTrack, SearchResponse } from '@jjdenhertog/plex-music-search';
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
            const { found: cachedTrackLinks } = getCachedTrackLinks(searchItems, 'plex')

            const result: SearchResponse[] = []

            for (let i = 0; i < searchItems.length; i++) {
                const searchItem = searchItems[i];

                // Process if no cached link has been found
                const trackLink = cachedTrackLinks.find(item => item.spotify_id == searchItem.id)
                if (!trackLink?.plex_id || trackLink.plex_id?.length == 0)
                    continue;

                // Load the plex tracks data
                const foundTracks: PlexTrack[] = []

                for (let j = 0; j < trackLink.plex_id.length; j++) {
                    const plexId = trackLink.plex_id[j]
                    try {
                        const metaData = await plexMusicSearch.getById(plexId)

                        // eslint-disable-next-line max-depth
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
                    artist: searchItem.artists[0],
                    album: searchItem.album || "",
                    result: foundTracks
                })

            }

            res.status(200).json(result);
        })


export default router.handler({
    onError: (err: any, req, res) => {
        console.log(err)
        generateError(req, res, "Songs", err);
    }
});
