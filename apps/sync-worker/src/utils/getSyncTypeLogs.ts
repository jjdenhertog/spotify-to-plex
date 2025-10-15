import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { SyncTypeLogCollection } from "@spotify-to-plex/shared-types/common/sync";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function getSyncTypeLogs(): SyncTypeLogCollection {
    const logsPath = join(getStorageDir(), 'sync_type_log.json');

    if (!existsSync(logsPath)) {
        return {
            users: undefined,
            albums: undefined,
            playlists: undefined,
            lidarr: undefined,
            mqtt: undefined
        };
    }

    try {
        const content = readFileSync(logsPath, 'utf8');

        return JSON.parse(content) as SyncTypeLogCollection;
    } catch {
        return {
            users: undefined,
            albums: undefined,
            playlists: undefined,
            lidarr: undefined,
            mqtt: undefined
        };
    }
}
