import { generateError } from '@/helpers/errors/generateError';
import { SpotifyCredentials, SpotifyUser } from '@/types/SpotifyAPI';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { configDir } from '../..';

export type GetSpotifyUserResponse = SpotifyUser
const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {

            const credentialsPath = join(configDir, 'spotify.json')
            if (!existsSync(credentialsPath))
                return res.status(400).json({ error: "No users are currently connected." })

            const users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))

            return res.status(200).json(users.map(item => item.user))
        }
    )
    .put(
        async (req, res) => {

            const credentialsPath = join(configDir, 'spotify.json')
            if (!existsSync(credentialsPath))
                return res.status(400).json({ error: "No users are currently connected." })

            const credentials: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))

            const { id, sync, label, daylist_morning, daylist_afternoon, daylist_evening, recent_songs } = req.body;
            const credential = credentials.find(item => item.user.id == id)
            if (!credential)
                return res.status(404).json({ error: "User is not found." })

            const { user } = credential;

            if (typeof sync == 'boolean')
                user.sync = sync;

            if (typeof daylist_morning == 'boolean')
                user.daylistMorning = daylist_morning;

            if (typeof daylist_afternoon == 'boolean')
                user.daylistAfternoon = daylist_afternoon;

            if (typeof daylist_evening == 'boolean')
                user.daylistEvening = daylist_evening;

            if (typeof recent_songs == 'boolean')
                user.recentSongs = recent_songs;

            if (typeof label == 'string')
                user.label = label;

            // Change the imtes
            writeFileSync(credentialsPath, JSON.stringify(credentials, undefined, 4))

            return res.status(200).json(credentials.map(item => item.user))
        }
    )
    .delete(
        async (req, res) => {

            const credentialsPath = join(configDir, 'spotify.json')
            if (!existsSync(credentialsPath))
                return res.status(400).json({ error: `No users are currently connected.` })

            const { id } = req.query
            if (typeof id != 'string')
                return res.status(400).json({ error: `ID expected but none found` })

            let users: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))
            if (!users.some(item => item.user.id == id))
                return res.status(400).json({ error: `User not found` })


            // Change the imtes
            users = users.filter(item => item.user.id != id)
            writeFileSync(credentialsPath, JSON.stringify(users, undefined, 4))

            return res.status(200).json(users)

        }

    )

export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Spotify import", err);
    },
});


