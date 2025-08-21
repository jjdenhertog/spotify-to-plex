import { AxiosRequest } from '@/helpers/AxiosRequest';
import { generateError } from '@/helpers/errors/generateError';
import getAPIUrl from '@/helpers/getAPIUrl';
import { addItemsToPlaylist } from '@/helpers/plex/addItemsToPlaylist';
import { putPlaylistPoster } from '@/helpers/plex/putPlaylistPoster';
import { removeItemsFromPlaylist } from '@/helpers/plex/removeItemsFromPlaylist';
import { updatePlaylist } from '@/helpers/plex/updatePlaylist';
import { plex, PlexPlaylists } from '@/library/plex';
import { GetPlaylistResponse } from '@/types/PlexAPI';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetPlexPlaylistIdResponse = {
    id: string,
    link: string
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {
            if (!plex.settings.uri || !plex.settings.token)
                return res.status(400).json({ msg: "No plex connection found" });

            const { id } = req.query
            if (typeof id != 'string')
                return res.status(400).json({ msg: "Invalid ID given" });

            const playlists: PlexPlaylists["data"] = plex.playlists.data || [];
            if (!playlists)
                return res.status(400).json({ msg: "Invalid playlists" });

            const playlistIds = playlists.find(item => item.id == id)
            if (!playlistIds)
                return res.status(404).json({ error: `Playlist not found connected to ${id}` })

            // Check the existence
            const url = getAPIUrl(plex.settings.uri, `/playlists`);
            const result = await AxiosRequest.get<GetPlaylistResponse>(url, plex.settings.token);
            const playlist = result.data.MediaContainer.Metadata.find(item => item.ratingKey == playlistIds.plex)
            if (!playlist)
                return res.status(404).json({ error: `Playlist not found with id ${playlistIds.plex}` })

            const link = getAPIUrl(plex.settings.uri, `/web/index.html#!/server/${plex.settings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlist.ratingKey}`)}`)
            res.json({ id: playlistIds.plex, link })
        })
    .put(
        async (req, res) => {
            const { id, name, label, thumb } = req.body;
            const items: { key: string, source?: string }[] = req.body.items;
            if (!items || items.length == 0 || typeof name != 'string' || typeof id != 'string')
                return res.status(400).json({ msg: "Invalid data given" });

            if (!plex.settings.uri || !plex.settings.token || !plex.settings.id)
                return res.status(400).json({ msg: "No plex connection found" });

            const playlists: PlexPlaylists["data"] = plex.playlists.data || [];
            if (!playlists)
                return res.status(400).json({ msg: "Invalid playlists" });

            const playlistIds = playlists.find(item => item.id == id)
            if (!playlistIds)
                return res.status(404).json({ error: `Playlist not found connected to ${id}` })

            // Check the existence
            const url = getAPIUrl(plex.settings.uri, `/playlists`);
            const result = await AxiosRequest.get<GetPlaylistResponse>(url, plex.settings.token);
            const playlist = result.data.MediaContainer.Metadata.find(item => item.ratingKey == playlistIds.plex);
            if (!playlist)
                return res.status(404).json({ error: `Playlist not found with id ${playlistIds.plex}` })

            // Clear items from playlist
            await removeItemsFromPlaylist(playlist.ratingKey);

            // Add all items
            await addItemsToPlaylist(playlist.ratingKey, items)

            if (playlist.title != name && name)
                await updatePlaylist(playlist.ratingKey, { title: name })

            // Update thumbnail of playlist
            if (typeof thumb == 'string') {
                try {
                    await putPlaylistPoster(playlist.ratingKey, thumb)
                } catch (_e) {
                }
            }

            const link = getAPIUrl(plex.settings.uri, `/web/index.html#!/server/${plex.settings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlist.ratingKey}`)}`)
            res.json({ id: playlist.ratingKey, link })

        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});


