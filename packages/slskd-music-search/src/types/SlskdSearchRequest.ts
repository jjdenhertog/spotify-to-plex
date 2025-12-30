export type SlskdSearchRequest = {
    query: string;
    limit?: number;
    timeout?: number;
    fileType?: string;
    minSize?: number;
    maxSize?: number;
};
