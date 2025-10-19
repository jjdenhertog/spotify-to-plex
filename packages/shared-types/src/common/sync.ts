/* eslint-disable custom/no-export-only-files */
export type SyncLog = {
    id: string;
    title: string;
    start: number;
    end?: number;
    error?: string;
};

export type SyncType = 'users' | 'albums' | 'playlists' | 'lidarr' | 'mqtt' | 'slskd';

export type SyncTypeLog = {
    type: SyncType;
    start: number;
    end?: number;
    status: 'running' | 'success' | 'error';
    error?: string;
    progress?: {
        current: number;
        total: number;
    };
};

export type SyncTypeLogCollection = {
    users?: SyncTypeLog;
    albums?: SyncTypeLog;
    playlists?: SyncTypeLog;
    lidarr?: SyncTypeLog;
    mqtt?: SyncTypeLog;
    slskd?: SyncTypeLog;
};

export type SyncLogCollection = {
    users: SyncLog[];
    albums: SyncLog[];
    playlists: SyncLog[];
    lidarr: SyncLog[];
    mqtt: SyncLog[];
    slskd: SyncLog[];
};