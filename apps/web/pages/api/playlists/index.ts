import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { generateError } from '@/helpers/errors/generateError';
import { getAPIUrl } from '@spotify-to-plex/shared-utils/utils/getAPIUrl';
import { putPlaylistPoster } from '@spotify-to-plex/plex-helpers/playlist/putPlaylistPoster';
import { addItemsToPlaylist } from '@spotify-to-plex/plex-helpers/playlist/addItemsToPlaylist';
import { storePlaylist } from '@spotify-to-plex/plex-helpers/playlist/storePlaylist';
import { getPlexUri } from '@spotify-to-plex/plex-helpers/utils/getPlexUri';
import { GetPlaylistResponse } from '@spotify-to-plex/shared-types/plex/GetPlaylistResponse';
import { Playlist } from '@spotify-to-plex/shared-types/plex/Playlist';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { addPlaylist } from '@spotify-to-plex/plex-config/functions/addPlaylist';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';

export type GetPlexPlaylistResponse = {
    key: Playlist["key"],
    guid: Playlist["guid"],
    title: Playlist["title"],
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res, _next) => {
            try {
                const settings = await getSettings();

                if (!settings.uri || !settings.token)
                    return res.status(400).json({ msg: "No plex connection found" });

                const url = getAPIUrl(settings.uri, `/playlists`);
                const playlistResult = await AxiosRequest.get<GetPlaylistResponse>(url, settings.token)
                const { data: plexData } = playlistResult;

                const result: GetPlexPlaylistResponse[] = []
                plexData.MediaContainer.Metadata.forEach((item) => {
                    if (!item.smart && item.playlistType === 'audio') {
                        result.push({
                            key: item.key,
                            guid: item.guid,
                            title: item.title,
                        })
                    }
                })
                res.json(result);
            } catch (error) {
                console.error('Error getting Plex playlists:', error);
                res.status(500).json({ error: 'Failed to get playlists' });
            }
        })
    .post(
        async (req, res) => {
            try {
                const { id, name, type, thumb } = req.body
                const items: { key: string, source?: string }[] = req.body.items;
                if (!items || items.length === 0 || typeof name !== 'string' || typeof id !== 'string' || typeof type !== 'string')
                    return res.status(400).json({ msg: "Invalid data given" });

                const settings = await getSettings();

                if (!settings.uri || !settings.token || !settings.id)
                    return res.status(400).json({ msg: "No plex connection found" });

                // Cast settings to required type since we've validated the fields
                const validatedSettings = settings as Required<typeof settings>;
                const firstItem = items.shift();
                if (!firstItem)
                    return res.status(400).json({ msg: "No items given" });

                const uri = getPlexUri(validatedSettings, firstItem.key, firstItem.source);
                const playlistId = await storePlaylist(validatedSettings, getAPIUrl, name, uri)
                await addItemsToPlaylist(validatedSettings, getAPIUrl, playlistId, items)

                // Update thumbnail of playlist
                if (typeof thumb === 'string') {
                    try {
                        await putPlaylistPoster(validatedSettings, getAPIUrl, playlistId, thumb)
                    } catch (_e) {
                    }
                }

                await addPlaylist({ type, id, plex: playlistId })

                const link = getAPIUrl(validatedSettings.uri, `/web/index.html#!/server/${validatedSettings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlistId}`)}`)
                res.json({ id: playlistId, link })
            } catch (error) {
                console.error('Error creating Plex playlist:', error);
                res.status(500).json({ error: 'Failed to create playlist' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Plex Playlists", err);
    }
});


