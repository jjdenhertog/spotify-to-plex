import { addItemsToPlaylist } from "@/helpers/plex/addItemsToPlaylist";
import { getUri } from "@/helpers/plex/getUri";
import { putPlaylistPoster } from "@/helpers/plex/putPlaylistPoster";
import { removeItemsFromPlaylist } from "@/helpers/plex/removeItemsFromPlaylist";
import { storePlaylist } from "@/helpers/plex/storePlaylist";
import { updatePlaylist } from "@/helpers/plex/updatePlaylist";
import { plex } from "@/library/plex";
import { Playlist } from "@/types/PlexAPI";
import { SearchResponse } from "@spotify-to-plex/plex-music-search";
import { type } from "node:os";

export async function putPlexPlaylist(id: string, plexPlaylist: Playlist | undefined | null, result: SearchResponse[], title: string, thumb: string) {
    const plexTracks = result.map(item => {
        if (item.result.length == 0)
            return null;

        return {
            key: item.result[0].id,
            source: item.result[0].source
        };
    }).filter(item => !!item);

    if (plexTracks.length > 0) {
        const firstItem = plexTracks.shift();
        if (!firstItem)
            return;

        if (plexPlaylist) {
            console.log(`Update existing playlist`);
            // Clear items from playlist
            await removeItemsFromPlaylist(plexPlaylist.ratingKey);

            // Add all items
            await addItemsToPlaylist(plexPlaylist.ratingKey, plexTracks);

            if (plexPlaylist.title != title && title)
                await updatePlaylist(plexPlaylist.ratingKey, { title });

            try {
                await putPlaylistPoster(plexPlaylist.ratingKey, thumb)
            } catch (_e) {
                console.log(`* Could not update poster image`)
            }
        } else {
            console.log(`Create new playlist`);

            const playlistId = await storePlaylist(title, getUri(firstItem.key, firstItem.source));
            await addItemsToPlaylist(playlistId, plexTracks);

            try {
                await putPlaylistPoster(playlistId, thumb)
            } catch (_e) {
                console.log(`* Could not update poster image`)
            }
            // Store new playlist
            plex.savePlaylist(type, id, playlistId);


        }
    }
}
