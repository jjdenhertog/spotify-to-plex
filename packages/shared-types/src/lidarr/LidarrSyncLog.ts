export type LidarrSyncLog = {
    id: string;
    artist_name: string;
    album_name: string;
    start: number;
    end?: number;
    status: 'success' | 'error' | 'not_found';
    error?: string;
    musicbrainz_album_id?: string;
    musicbrainz_artist_id?: string;
};
