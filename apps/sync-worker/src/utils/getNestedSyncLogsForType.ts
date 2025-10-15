import { SyncLog, SyncType } from "@spotify-to-plex/shared-types/common/sync";
import { getNestedSyncLogs } from "./getNestedSyncLogs";
import { saveNestedSyncLogs } from "./saveNestedSyncLogs";

export function getNestedSyncLogsForType(syncType: SyncType) {
    const logs = getNestedSyncLogs();

    const putLog = (id: string, title: string): SyncLog => {
        let itemLog = logs[syncType].find(log => log.id === id);

        if (itemLog) {
            // Restart log
            itemLog.start = Date.now();
            itemLog.end = undefined;
            itemLog.error = undefined;
        } else {
            itemLog = { id, title, start: Date.now() };
            logs[syncType].push(itemLog);
        }

        saveNestedSyncLogs(logs);

        return itemLog;
    };

    const logError = (item: SyncLog, error: string): void => {
        item.error = error;
        item.end = Date.now();
        saveNestedSyncLogs(logs);
    };

    const logComplete = (item: SyncLog): void => {
        item.error = undefined;
        item.end = Date.now();
        saveNestedSyncLogs(logs);
    };

    return { putLog, logError, logComplete };
}
