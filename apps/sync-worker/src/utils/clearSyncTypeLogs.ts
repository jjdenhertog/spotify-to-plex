import { SyncType } from "@spotify-to-plex/shared-types/common/sync";
import { getNestedSyncLogs } from "./getNestedSyncLogs";
import { saveNestedSyncLogs } from "./saveNestedSyncLogs";

export function clearSyncTypeLogs(type: SyncType): void {
    const logs = getNestedSyncLogs();
    logs[type] = [];
    saveNestedSyncLogs(logs);
}
