import { SlskdFile } from "./SlskdFile";

export type SlskdSearchResponse = {
    id: string;
    query: string;
    state: 'Requested' | 'InProgress' | 'Completed' | 'Errored' | 'Cancelled';
    files: SlskdFile[];
    fileCount: number;
    lockedFileCount: number;
    responseCount: number;
    startedAt: string;
    endedAt?: string;
};
