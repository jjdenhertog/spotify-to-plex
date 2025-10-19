export type SlskdSettings = {
    enabled: boolean;
    url: string;
    allowed_extensions: string[];
    min_bitrate: number;
    min_bitdepth: number;
    // max_length_difference: number; // TODO: Re-enable when Track type includes duration_ms
    retry_limit: number;
    search_timeout: number;
    download_attempts: number;
    auto_sync: boolean;
};
