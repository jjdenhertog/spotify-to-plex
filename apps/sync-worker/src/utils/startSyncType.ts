import { SyncType } from "@spotify-to-plex/shared-types/common/sync";
import { getSyncTypeLogs } from "./getSyncTypeLogs";
import { saveSyncTypeLogs } from "./saveSyncTypeLogs";

export function startSyncType(type: SyncType) {
    const logs = getSyncTypeLogs();

    logs[type] = {
        type,
        start: Date.now(),
        status: 'running'
    };

    saveSyncTypeLogs(logs);
}
