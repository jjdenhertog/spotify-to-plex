import { AxiosRequest } from '@/helpers/AxiosRequest';
import { generateError } from '@/helpers/errors/generateError';
import getAPIUrl from '@/helpers/getAPIUrl';
import { putPlaylistPoster } from '@/helpers/plex/putPlaylistPoster';
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
        async (_req, res, _next) => {

            if (!plex.settings.uri || !plex.settings.token)
                return res.status(400).json({ msg: "No plex connection found" });

            const url = getAPIUrl(plex.settings.uri, `/playlists`);
            const playlistResult = await AxiosRequest.get<GetPlaylistResponse>(url, plex.settings.token)
            const { data: plexData } = playlistResult;

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
        async (req, res) => {
            const { id, name, type, thumb } = req.body
            const items: { key: string, source?: string }[] = req.body.items;
            if (!items || items.length == 0 || typeof name != 'string' || typeof id != 'string' || typeof type != 'string')
                return res.status(400).json({ msg: "Invalid data given" });

            if (!plex.settings.uri || !plex.settings.token || !plex.settings.id)
                return res.status(400).json({ msg: "No plex connection found" });

            const firstItem = items.shift();
            if (!firstItem)
                return res.status(400).json({ msg: "No items given" });

            const playlistId = await storePlaylist(name, getUri(firstItem.key, firstItem.source))
            await addItemsToPlaylist(playlistId, items)

            // Update thumbnail of playlist
            if (typeof thumb == 'string') {
                try {
                    await putPlaylistPoster(playlistId, thumb)
                } catch (_e) {
                }
            }

            plex.savePlaylist(type, id, playlistId)

            const link = getAPIUrl(plex.settings.uri, `/web/index.html#!/server/${plex.settings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlistId}`)}`)
            res.json({ id: playlistId, link })
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Plex Playlists", err);
    }
});


