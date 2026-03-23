import { generateError } from '@/helpers/errors/generateError';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import type { TrackLink } from '@spotify-to-plex/shared-types/common/track';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {
            try {
                const { spotifyId, title, artist, plexTrack } = req.body;

                if (!spotifyId || !title || !artist || !plexTrack) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                // Read the existing cache
                const path = join(getStorageDir(), 'track_links.json');
                let allLinks: TrackLink[] = [];

                if (existsSync(path)) {
                    allLinks = JSON.parse(readFileSync(path, 'utf8'));
                }

                // Find or create the track link
                let trackLink = allLinks.find(item => item.spotify_id === spotifyId);
                if (!trackLink) {
                    trackLink = { spotify_id: spotifyId };
                    allLinks.push(trackLink);
                }

                // Add the plex_id (replace if it exists, since this is a manual selection)
                trackLink.plex_id = [plexTrack.id];

                // Write back to cache
                writeFileSync(path, JSON.stringify(allLinks, undefined, 4));

                res.status(200).json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to cache manual match' });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        console.log(err)
        generateError(req, res, "Cache Manual Match", err);
    }
});
