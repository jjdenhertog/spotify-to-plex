import axios from 'axios';
import type { SlskdSearchResults } from './types';
import { withRetry } from '../lidarr/utils/withRetry';

/**
 * Get the results of a completed search
 * GET /api/v0/searches/{id}/responses
 */
export async function getSearchResults(
    searchId: string,
    slskdUrl: string,
    apiKey: string
): Promise<SlskdSearchResults> {
    const baseUrl = slskdUrl.endsWith('/') ? slskdUrl.slice(0, -1) : slskdUrl;
    const resultsUrl = `${baseUrl}/api/v0/searches/${searchId}/responses`;

    const response = await withRetry(
        () => axios.get<SlskdSearchResults>(resultsUrl, {
            headers: {
                'X-API-Key': apiKey
            }
        })
    );

    return response.data;
}
