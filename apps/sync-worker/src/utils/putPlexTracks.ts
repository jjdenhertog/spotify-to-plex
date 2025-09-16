import { addItemsToPlaylist } from "@spotify-to-plex/plex-helpers/playlist/addItemsToPlaylist";
import { putPlaylistPoster } from "@spotify-to-plex/plex-helpers/playlist/putPlaylistPoster";
import { removeItemsFromPlaylist } from "@spotify-to-plex/plex-helpers/playlist/removeItemsFromPlaylist";
import { storePlaylist } from "@spotify-to-plex/plex-helpers/playlist/storePlaylist";
import { updatePlaylist } from "@spotify-to-plex/plex-helpers/playlist/updatePlaylist";
import { getPlexUri } from "@spotify-to-plex/plex-helpers/utils/getPlexUri";
import { getAPIUrl } from "@spotify-to-plex/shared-utils/utils/getAPIUrl";
import { plex } from "../library/plex";
import { Playlist } from "@spotify-to-plex/shared-types/plex/Playlist";
import { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import { type } from "node:os";

export async function putPlexPlaylist(id: string, plexPlaylist: Playlist | undefined | null, result: SearchResponse[], title: string, thumb: string) {
    const plexTracks = result.map(item => {
        if (item.result.length == 0)
            return null;

        const [firstResult] = item.result;
        if (!firstResult) return null;

        return {
            key: firstResult.id,
            source: firstResult.source
        };
    }).filter(item => !!item);

    if (plexTracks.length > 0) {
        const firstItem = plexTracks.shift();
        if (!firstItem)
            return;

        // Get settings once at the start
        const rawSettings = await plex.getSettings();
        if (!rawSettings.uri || !rawSettings.token || !rawSettings.id) {
            throw new Error('Plex settings not configured properly');
        }
        
        // Cast to required type since we've verified all required fields exist
        const settings = rawSettings as Required<typeof rawSettings>;

        if (plexPlaylist) {
            console.log(`Update existing playlist`);
            // Clear items from playlist
            await removeItemsFromPlaylist(settings, getAPIUrl, plexPlaylist.ratingKey, []);

            // Add all items
            await addItemsToPlaylist(settings, getAPIUrl, plexPlaylist.ratingKey, plexTracks);

            if (plexPlaylist.title != title && title)
                await updatePlaylist(settings, getAPIUrl, plexPlaylist.ratingKey, { title });

            try {
                await putPlaylistPoster(settings, getAPIUrl, plexPlaylist.ratingKey, thumb)
            } catch (_e) {
                console.log(`* Could not update poster image`)
            }
        } else {
            console.log(`Create new playlist`);

            const uri = getPlexUri(settings, firstItem.key, firstItem.source);
            const playlistId = await storePlaylist(settings, getAPIUrl, title, uri);
            await addItemsToPlaylist(settings, getAPIUrl, playlistId, plexTracks);

            try {
                await putPlaylistPoster(settings, getAPIUrl, playlistId, thumb)
            } catch (_e) {
                console.log(`* Could not update poster image`)
            }
            // Store new playlist
            await plex.addPlaylist({ type: type(), id, plex: playlistId });
        }
    }
}
