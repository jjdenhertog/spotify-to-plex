import axios from 'axios';
import type { SlskdSearch } from './types';
import { withRetry } from '../lidarr/utils/withRetry';

/**
 * Get the status of a search by ID
 * GET /api/v0/searches/{id}
 */
export async function getSearchStatus(
    searchId: string,
    slskdUrl: string,
    apiKey: string
): Promise<SlskdSearch> {
    const baseUrl = slskdUrl.endsWith('/') ? slskdUrl.slice(0, -1) : slskdUrl;
    const statusUrl = `${baseUrl}/api/v0/searches/${searchId}`;

    const response = await withRetry(
        () => axios.get<SlskdSearch>(statusUrl, {
            headers: {
                'X-API-Key': apiKey
            }
        })
    );

    return response.data;
}
