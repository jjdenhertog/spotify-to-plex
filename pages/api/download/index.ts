import { generateError } from '@/helpers/errors/generateError';
import { configDir } from "@/library/configDir";
import { TrackLink } from '@/types/TrackLink';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {

            const { type, tracks } = req.body;
            if (type != 'spotify' && type != 'tidal')
                throw new Error(`Invalid type: tidal or spotify expected`)

            if (typeof tracks != 'string')
                throw new Error(`Tracks expected`)

            const trackIds = tracks.split(',')
            if (!trackIds || trackIds.length == 0)
                throw new Error(`Tracks were submitted, but had a length of zero.`)


            const getPrettyNumber = (value: number) => {
                return value
                    .toString()
                    .padStart(2, '0')
            }

            const today = new Date()
            const timestamp = `${getPrettyNumber(today.getFullYear())}${getPrettyNumber(today.getMonth() + 1)}${getPrettyNumber(today.getDate())}_${getPrettyNumber(today.getHours())}${getPrettyNumber(today.getMinutes())}`
            const filename = `${type}_${timestamp}.txt`;

            // Set headers to prompt file download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'text/plain');

            switch (type) {
                case "tidal":
                    const path = join(configDir, 'track_links.json')

                    if (!existsSync(path))
                        throw new Error(`No Tidal links found`)

                    const trackLinks: TrackLink[] = JSON.parse(readFileSync(path, 'utf8'))
                    const tidalTracks = trackLinks
                        .filter(item => trackIds.includes(item.spotify_id))
                        .map(item => item.tidal_id ? item.tidal_id[0] : null)
                        .filter(item => !!item)

                    res.send(tidalTracks.map(id => `https://tidal.com/browse/track/${id}`).join('\n'))

                    break;

                default:
                case "spotify":
                    res.send(trackIds.map(id => `https://open.spotify.com/track/${id}`).join('\n'))
                    break;
            }

        }
    )

export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Tidal login", err);
    },
});


