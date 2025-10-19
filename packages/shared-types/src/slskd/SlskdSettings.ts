export type SlskdSettings = {
    enabled: boolean;
    url: string;
    api_key: string;
    allowed_extensions: string[];
    min_bitrate: number;
    min_bitdepth: number;
    max_length_difference: number;
    retry_limit: number;
    search_timeout: number;
    download_attempts: number;
    auto_sync: boolean;
};
