/**
 * SLSKD API response types
 * Based on the SLSKD API v0 specification
 */

export type SlskdSearch = {
    endedAt: string;
    fileCount: number;
    id: string;
    isComplete: boolean;
    lockedFileCount: number;
    responseCount: number;
    searchText: string;
    startedAt: string;
    state: string;
    token: number;
}

export type SlskdFile = {
    bitRate: number;
    bitDepth: number;
    code: number;
    extension: string;
    filename: string;
    length: number;
    size: number;
    isLocked: boolean;
}

export type SlskdSearchResult = {
    fileCount: number;
    files: SlskdFile[];
    hasFreeUploadSlot: boolean;
    lockedFileCount: number;
    lockedFiles: unknown[];
    queueLength: number;
    token: number;
    uploadSpeed: number;
    username: string;
}

export type SlskdSearchResults = SlskdSearchResult[];

export type SlskdCollectedFile = {
    username: string;
} & SlskdFile

export type SlskdDownloadPayload = {
    filename: string;
    size: number;
}

export type SlskdConfig = {
    url: string;
    apiKey: string;
    timeout?: number;
    retry?: number;
    filters: {
        extensions: string[];
        minBitRate?: number;
        minBitDepth?: number;
    };
    downloadAttempts: number;
}

export type SlskdTrackInfo = {
    artist: string;
    album: string;
    title: string;
    duration: number;
}
