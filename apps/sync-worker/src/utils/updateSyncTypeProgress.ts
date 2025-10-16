import { SyncType } from "@spotify-to-plex/shared-types/common/sync";
import { getSyncTypeLogs } from "./getSyncTypeLogs";
import { saveSyncTypeLogs } from "./saveSyncTypeLogs";

export function updateSyncTypeProgress(type: SyncType, current: number, total: number): void {
    const logs = getSyncTypeLogs();

    if (logs[type]) {
        logs[type] = {
            ...logs[type],
            progress: {
                current,
                total
            }
        };
    }

    saveSyncTypeLogs(logs);
}
