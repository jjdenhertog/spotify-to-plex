import { AxiosRequest } from '@/helpers/AxiosRequest';
import { generateError } from '@/helpers/errors/generateError';
import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import { GetPlaylistResponse, Playlist } from '@/types/PlexAPI';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { addItemsToPlaylist } from '../../../src/helpers/plex/addItemsToPlaylist';
import { getUri } from '../../../src/helpers/plex/getUri';
import { storePlaylist } from '../../../src/helpers/plex/storePlaylist';

export type GetPlexPlaylistResponse = {
    key: Playlist["key"],
    guid: Playlist["guid"],
    title: Playlist["title"],
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res, next) => {
            if (!plex.settings.uri || !plex.settings.token) {
                return res.status(400).json({ msg: "No plex connection found" });
                return;
            }

            const url = getAPIUrl(plex.settings.uri, `/playlists`);
            const plexData = (await AxiosRequest.get<GetPlaylistResponse>(url, plex.settings.token)).data;
            const result: GetPlexPlaylistResponse[] = []
            plexData.MediaContainer.Metadata.forEach((item) => {
                if (!item.smart && item.playlistType == 'audio') {
                    result.push({
                        key: item.key,
                        guid: item.guid,
                        title: item.title,
                    })
                }
            })
            res.json(result);
        })
    .post(
        async (req, res, next) => {
            const type: string = req.body.type;
            const name: string = req.body.name;
            const id: string = req.body.id;
            const items: { key: string, source?: string }[] = req.body.items;
            if (!items || items.length == 0 || !name || !id || !type)
                return res.status(400).json({ msg: "Invalid data given" });

            if (!plex.settings.uri || !plex.settings.token || !plex.settings.id) {
                return res.status(400).json({ msg: "No plex connection found" });
                return;
            }

            // const playlistName: string = req.body.playlistName;
            const firstItem = items.shift();
            if (!firstItem)
                return res.status(400).json({ msg: "No items given" });

            const playlistId = await storePlaylist(name, getUri(firstItem.key, firstItem.source))
            await addItemsToPlaylist(playlistId, items)

            plex.savePlaylist(type, id, playlistId)

            const link = getAPIUrl(plex.settings.uri, `/web/index.html#!/server/${plex.settings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlistId}`)}`)
            res.json({ id: playlistId, link: link })
        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Plex Playlists", err);
    }
});


