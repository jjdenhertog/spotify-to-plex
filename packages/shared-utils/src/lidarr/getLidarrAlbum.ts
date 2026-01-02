import axios from 'axios';
import { withRetry } from './utils/withRetry';

export type LidarrAlbum = {
    id: number;
    foreignAlbumId: string;
    title: string;
    monitored: boolean;
    artistId: number;
};

/**
 * Get an existing album from Lidarr by its MusicBrainz release group ID
 */
export async function getLidarrAlbum(foreignAlbumId: string, lidarrUrl: string, apiKey: string): Promise<LidarrAlbum | null> {
    try {
        const baseUrl = lidarrUrl.endsWith('/') ? lidarrUrl.slice(0, -1) : lidarrUrl;
        const url = `${baseUrl}/api/v1/album?foreignAlbumId=${foreignAlbumId}`;

        const response = await withRetry(
            () => axios.get<LidarrAlbum[]>(url, {
                headers: {
                    'X-Api-Key': apiKey
                }
            })
        );

        if (!response.data || response.data.length === 0)
            return null;

        return response.data[0] ?? null;

    } catch {
        return null;
    }
}
