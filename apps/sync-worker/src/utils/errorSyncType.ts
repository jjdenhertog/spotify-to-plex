import { SyncType } from "@spotify-to-plex/shared-types/common/sync";
import { getSyncTypeLogs } from "./getSyncTypeLogs";
import { saveSyncTypeLogs } from "./saveSyncTypeLogs";

export function errorSyncType(type: SyncType, error: string): void {
    const logs = getSyncTypeLogs();

    if (logs[type]) {
        logs[type] = {
            ...logs[type]!,
            end: Date.now(),
            status: 'error',
            error
        };
    }

    saveSyncTypeLogs(logs);
}
