import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/server';
// MIGRATED: Updated to use shared utils package
import { Track } from '@spotify-to-plex/shared-types/spotify/api';
// MIGRATED: Updated to use shared types package
import { settingsDir } from '@spotify-to-plex/shared-utils/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetTidalTracksResponse = {
    id: string,
    title: string
    artist: string
    album: string
    tidal_ids: string[]
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {

            const searchItems: Track[] = req.body.items
            if (!Array.isArray(searchItems))
                throw new Error(`Array of items expected, none found`)

            //////////////////////////////////////
            // Handeling cached links
            //////////////////////////////////////
            const { found: cachedTrackLinks } = getCachedTrackLinks(searchItems, 'tidal', settingsDir)

            const result: GetTidalTracksResponse[] = []

            for (let i = 0; i < searchItems.length; i++) {
                const searchItem = searchItems[i];
                if (!searchItem)
                    continue;

                // Process if no cached link has been found
                const trackLink = cachedTrackLinks.find(item => item.spotify_id === searchItem.id)
                const tidalIds = trackLink?.tidal_id
                if (!tidalIds || tidalIds.length === 0)
                    continue;

                result.push({
                    id: searchItem.id,
                    title: searchItem.title,
                    artist: searchItem.artists?.[0] || '',
                    album: searchItem.album || "",
                    tidal_ids: tidalIds,
                })
            }

            return res.status(200).json(result)
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Tidal Tracks", err);
    },
});


