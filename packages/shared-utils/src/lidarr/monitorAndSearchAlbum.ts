import axios from 'axios';
import { withRetry } from './utils/withRetry';
import { getLidarrAlbum } from './getLidarrAlbum';

/**
 * Monitor an existing album in Lidarr and trigger a search to download it
 * Returns true if successful, false otherwise
 */
export async function monitorAndSearchAlbum(
    foreignAlbumId: string,
    lidarrUrl: string,
    apiKey: string
): Promise<{ success: boolean; message: string }> {
    try {
        const baseUrl = lidarrUrl.endsWith('/') ? lidarrUrl.slice(0, -1) : lidarrUrl;

        // Get the existing album from Lidarr
        const existingAlbum = await getLidarrAlbum(foreignAlbumId, lidarrUrl, apiKey);

        if (!existingAlbum) {
            return {
                success: false,
                message: 'Album not found in Lidarr database'
            };
        }

        // If not monitored, update to monitored
        if (!existingAlbum.monitored) {
            const updateUrl = `${baseUrl}/api/v1/album/${existingAlbum.id}`;

            await withRetry(
                () => axios.put(updateUrl, {
                    ...existingAlbum,
                    monitored: true
                }, {
                    headers: {
                        'X-Api-Key': apiKey,
                        'Content-Type': 'application/json'
                    }
                })
            );
        }

        // Trigger album search to start download
        const commandUrl = `${baseUrl}/api/v1/command`;
        await withRetry(
            () => axios.post(commandUrl, {
                name: 'AlbumSearch',
                albumIds: [existingAlbum.id]
            }, {
                headers: {
                    'X-Api-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            })
        );

        return {
            success: true,
            message: existingAlbum.monitored
                ? 'Album already monitored, search triggered'
                : 'Album set to monitored and search triggered'
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return {
            success: false,
            message: `Failed to monitor/search album: ${message}`
        };
    }
}
