import { AxiosRequest } from '@spotify-to-plex/http-client';
// MIGRATED: Updated to use http-client package
import { generateError } from '@/helpers/errors/generateError';
import getAPIUrl from '@/helpers/getAPIUrl';
import { addItemsToPlaylist } from '@/helpers/plex/addItemsToPlaylist';
import { putPlaylistPoster } from '@/helpers/plex/putPlaylistPoster';
import { removeItemsFromPlaylist } from '@/helpers/plex/removeItemsFromPlaylist';
import { updatePlaylist } from '@/helpers/plex/updatePlaylist';
import { plex, PlexPlaylists } from '@/library/plex';
import { GetPlaylistResponse } from '@spotify-to-plex/shared-types';
// MIGRATED: Updated to use shared types package
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetPlexPlaylistIdResponse = {
    id: string,
    link: string
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {
            try {
                const settings = await plex.getSettings();
                
                if (!settings.uri || !settings.token)
                    return res.status(400).json({ msg: "No plex connection found" });

                const { id } = req.query
                if (typeof id != 'string')
                    return res.status(400).json({ msg: "Invalid ID given" });

                const playlistsData = await plex.getPlaylists();
                const playlists: PlexPlaylists["data"] = playlistsData.data || [];
                if (!playlists)
                    return res.status(400).json({ msg: "Invalid playlists" });

                const playlistIds = playlists.find(item => item.id == id)
                if (!playlistIds)
                    return res.status(404).json({ error: `Playlist not found connected to ${id}` })

                // Check the existence
                const url = getAPIUrl(settings.uri, `/playlists`);
                const result = await AxiosRequest.get<GetPlaylistResponse>(url, settings.token);
                const playlist = result.data.MediaContainer.Metadata.find(item => item.ratingKey == playlistIds.plex)
                if (!playlist)
                    return res.status(404).json({ error: `Playlist not found with id ${playlistIds.plex}` })

                const link = getAPIUrl(settings.uri, `/web/index.html#!/server/${settings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlist.ratingKey}`)}`)
                res.json({ id: playlistIds.plex, link })
            } catch (error) {
                console.error('Error getting Plex playlist by ID:', error);
                res.status(500).json({ error: 'Failed to get playlist' });
            }
        })
    .put(
        async (req, res) => {
            try {
                const { id, name, label: _label, thumb } = req.body;
            const items: { key: string, source?: string }[] = req.body.items;
            if (!items || items.length == 0 || typeof name != 'string' || typeof id != 'string')
                return res.status(400).json({ msg: "Invalid data given" });

                const settings = await plex.getSettings();

                if (!settings.uri || !settings.token || !settings.id)
                    return res.status(400).json({ msg: "No plex connection found" });

                const playlistsData = await plex.getPlaylists();
                const playlists: PlexPlaylists["data"] = playlistsData.data || [];
            if (!playlists)
                return res.status(400).json({ msg: "Invalid playlists" });

            const playlistIds = playlists.find(item => item.id == id)
            if (!playlistIds)
                return res.status(404).json({ error: `Playlist not found connected to ${id}` })

                // Check the existence
                const url = getAPIUrl(settings.uri, `/playlists`);
                const result = await AxiosRequest.get<GetPlaylistResponse>(url, settings.token);
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

                const link = getAPIUrl(settings.uri, `/web/index.html#!/server/${settings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlist.ratingKey}`)}`)
                res.json({ id: playlist.ratingKey, link })
            } catch (error) {
                console.error('Error updating Plex playlist:', error);
                res.status(500).json({ error: 'Failed to update playlist' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});


