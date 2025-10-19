import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { SyncLogCollection } from "@spotify-to-plex/shared-types/common/sync";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function getNestedSyncLogs(): SyncLogCollection {
    const logsPath = join(getStorageDir(), 'sync_log.json');

    if (!existsSync(logsPath)) {
        return {
            users: [],
            albums: [],
            playlists: [],
            lidarr: [],
            mqtt: [],
            slskd: []
        };
    }

    try {
        const content = readFileSync(logsPath, 'utf8');

        return JSON.parse(content) as SyncLogCollection;
    } catch {
        return {
            users: [],
            albums: [],
            playlists: [],
            lidarr: [],
            mqtt: [],
            slskd: []
        };
    }
}
