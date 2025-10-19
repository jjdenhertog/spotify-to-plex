export type SlskdSyncLog = {
    id: string;
    artist_name: string;
    track_name: string;
    start: number;
    end?: number;
    status: 'success' | 'error' | 'not_found' | 'downloading' | 'queued';
    error?: string;
    file_path?: string;
    file_size?: number;
    download_username?: string;
};
