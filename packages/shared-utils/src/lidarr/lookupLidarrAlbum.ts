import axios from 'axios';
import type { LidarrLookupResult } from '@spotify-to-plex/shared-types/musicbrainz/LidarrLookupResult';
import { withRetry } from './utils/withRetry';

/**
 * Lookup album in Lidarr using MusicBrainz release group ID
 */
export async function lookupLidarrAlbum(releaseGroupId: string, lidarrUrl: string, apiKey: string) {
    try {
        const baseUrl = lidarrUrl.endsWith('/') ? lidarrUrl.slice(0, -1) : lidarrUrl;
        const lookupUrl = `${baseUrl}/api/v1/album/lookup?term=lidarr:${releaseGroupId}`;

        const response = await withRetry(
            () => axios.get<LidarrLookupResult[]>(lookupUrl, {
                headers: {
                    'X-Api-Key': apiKey
                }
            })
        );

        if (!response.data || response.data.length === 0)
            return null;

        const [result] = response.data;

        if (!result)
            return null;

        return result;

    } catch (_e: unknown) {
        return null;
    }
}
