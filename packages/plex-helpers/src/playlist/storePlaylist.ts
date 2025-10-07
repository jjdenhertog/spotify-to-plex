import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { GetPlaylistResponse } from '@spotify-to-plex/shared-types/plex/GetPlaylistResponse';
import { PlexSettings } from '../PlexSettings';
import { PlexPlaylistError } from '../PlexPlaylistError';
import { validatePlexSettings } from '../utils/validatePlexSettings';
import { getAPIUrl } from '@spotify-to-plex/shared-utils/utils/getAPIUrl';

/**
 * Creates a new Plex playlist
 */
export async function storePlaylist(settings: PlexSettings, name: string, uri: string): Promise<string> {
    validatePlexSettings(settings);

    const url = getAPIUrl(settings.uri, `/playlists`);
    const query = new URLSearchParams({
        title: name,
        type: "audio",
        smart: "0",
        uri
    });

    const result = await AxiosRequest.post<GetPlaylistResponse>(
        `${url}?${query.toString()}`,
        settings.token
    );

    const id = result.data.MediaContainer.Metadata?.[0]?.ratingKey;

    if (!id) {
        throw new PlexPlaylistError('Failed to create playlist - no ID returned');
    }

    return id;
}