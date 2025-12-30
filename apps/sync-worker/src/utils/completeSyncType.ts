import { SyncType } from "@spotify-to-plex/shared-types/common/sync";
import { getSyncTypeLogs } from "./getSyncTypeLogs";
import { saveSyncTypeLogs } from "./saveSyncTypeLogs";

export function completeSyncType(type: SyncType) {
    const logs = getSyncTypeLogs();

    if (logs[type]) {
        logs[type] = {
            ...logs[type],
            end: Date.now(),
            status: 'success',
            error: undefined
        };
    }

    saveSyncTypeLogs(logs);
}
