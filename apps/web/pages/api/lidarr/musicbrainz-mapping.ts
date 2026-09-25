import { generateError } from '@/helpers/errors/generateError';
import { getMusicBrainzIds } from '@spotify-to-plex/shared-utils/lidarr/getMusicBrainzIds';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetMusicBrainzMappingResponse = {
    found: boolean;
    releaseGroupId?: string;
};

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        const { spotify_album_id, artist_name, album_name } = req.body;

        if (!spotify_album_id)
            return res.status(400).json({ error: 'spotify_album_id is required' });

        // Only successful lookups are cached, so this sees releases created since the last attempt
        const musicBrainzIds = await getMusicBrainzIds(spotify_album_id, artist_name, album_name);
        const result: GetMusicBrainzMappingResponse = musicBrainzIds
            ? { found: true, releaseGroupId: musicBrainzIds.releaseGroupId }
            : { found: false };

        res.status(200).json(result);
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "MusicBrainz Mapping", err);
    }
});
