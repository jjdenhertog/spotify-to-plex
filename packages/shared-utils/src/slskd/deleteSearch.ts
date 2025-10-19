import axios from 'axios';
import { withRetry } from '../lidarr/utils/withRetry';

/**
 * Delete a search by ID
 * DELETE /api/v0/searches/{id}
 */
export async function deleteSearch(
    searchId: string,
    slskdUrl: string,
    apiKey: string
): Promise<void> {
    const baseUrl = slskdUrl.endsWith('/') ? slskdUrl.slice(0, -1) : slskdUrl;
    const deleteUrl = `${baseUrl}/api/v0/searches/${searchId}`;

    await withRetry(
        () => axios.delete(deleteUrl, {
            headers: {
                'X-API-Key': apiKey
            }
        })
    );
}
