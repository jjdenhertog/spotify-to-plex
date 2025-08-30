import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/server';
import { plex } from '@/library/plex';
import { settingsDir } from '@spotify-to-plex/shared-utils/server';
import { getById } from '@spotify-to-plex/plex-music-search/functions/getById';
import { PlexMusicSearchTrack } from '@spotify-to-plex/plex-music-search/types/PlexMusicSearchTrack';
import { PlexTrack } from '@spotify-to-plex/plex-music-search/types/PlexTrack';
import { getMusicSearchConfig } from '@spotify-to-plex/music-search/config/config-utils';

import { SearchResponse } from '@spotify-to-plex/plex-music-search/types/SearchResponse';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

async function getPlexTracks(plexIds: string[], plexConfig: any): Promise<PlexTrack[]> {
    const foundTracks: PlexTrack[] = []
    
    for (const plexId of plexIds.filter(Boolean)) {
        try {
            const metaData = await getById(plexConfig, plexId)
            if (metaData)
                foundTracks.push(metaData)
        } catch (_e) {
        }
    }
    
    return foundTracks
}


const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const searchItems: PlexMusicSearchTrack[] = req.body.items;

                if (!Array.isArray(searchItems))
                    return res.status(200).json([]);

                const settings = await plex.getSettings();

                if (!settings.token || !settings.uri)
                    return res.status(400).json({ msg: "Plex not configured" });

                //////////////////////////////////////
                // Load music search configuration
                //////////////////////////////////////
                const musicSearchConfig = await getMusicSearchConfig(settingsDir);

                const plexConfig = {
                    uri: settings.uri,
                    token: settings.token,
                    musicSearchConfig
                };

                //////////////////////////////////////
                // Handeling cached links
                //////////////////////////////////////
                const { found: cachedTrackLinks } = getCachedTrackLinks(searchItems, 'plex', settingsDir)

                const result: SearchResponse[] = []

                for (let i = 0; i < searchItems.length; i++) {
                    const searchItem = searchItems[i];
                    if (!searchItem)
                        continue;

                    // Process if no cached link has been found
                    const trackLink = cachedTrackLinks.find(item => item.spotify_id === searchItem.id)
                    if (!trackLink?.plex_id || trackLink.plex_id?.length === 0)
                        continue;

                    // Load the plex tracks data
                    const foundTracks = await getPlexTracks(trackLink.plex_id, plexConfig)

                    // Try searching again if no tracks are found
                    if (foundTracks.length === 0)
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
            } catch (error) {
                console.error('Error getting cached Plex tracks:', error);
                res.status(500).json({ error: 'Failed to get cached tracks' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        console.log(err)
        generateError(req, res, "Songs", err);
    }
});
