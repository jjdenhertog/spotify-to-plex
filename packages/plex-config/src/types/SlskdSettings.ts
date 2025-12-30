export type SlskdSettings = {
    enabled: boolean;
    url: string;
    allowed_extensions: string[];
    retry_limit: number;
    search_timeout: number;
    max_results: number;
    download_attempts: number;
    auto_sync: boolean;
};
