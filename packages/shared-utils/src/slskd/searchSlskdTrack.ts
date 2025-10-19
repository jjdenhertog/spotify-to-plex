import axios from 'axios';
import type { SlskdSearch, SlskdTrackInfo } from './types';
import { withRetry } from '../lidarr/utils/withRetry';

/**
 * Initiate a search on SLSKD for a track
 * POST /api/v0/searches
 */
export async function searchSlskdTrack(
    trackInfo: SlskdTrackInfo,
    slskdUrl: string,
    apiKey: string
): Promise<string> {
    const baseUrl = slskdUrl.endsWith('/') ? slskdUrl.slice(0, -1) : slskdUrl;
    const searchUrl = `${baseUrl}/api/v0/searches`;

    const searchText = `${trackInfo.title} - ${trackInfo.artist}`;

    const response = await withRetry(
        () => axios.post<SlskdSearch>(
            searchUrl,
            { searchText },
            {
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        )
    );

    return response.data.id;
}
