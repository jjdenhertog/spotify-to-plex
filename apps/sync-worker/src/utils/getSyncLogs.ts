import { settingsDir } from "@/web/library/settingsDir";
import { SyncLog } from "@/web/types/SyncLog";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function getSyncLogs() {
    // Get the logs
    const logsPath = join(settingsDir, 'sync_log.json');
    let logs: SyncLog[] = [];
    if (existsSync(logsPath))
        logs = JSON.parse(readFileSync(logsPath, 'utf8'));

    const putLog = (id: string, title: string) => {
        let itemLog = logs.find(log => log.id == id);
        if (!itemLog) {
            itemLog = { id, title, start: Date.now() };
            logs.push(itemLog);
        }

        // Restart log
        itemLog.start = Date.now();
        itemLog.end = undefined;
        itemLog.error = undefined;

        return itemLog;
    };

    const logError = (item: SyncLog, error: string) => {
        item.error = error;
        item.end = Date.now();
        saveLogs();
    };
    const logComplete = (item: SyncLog) => {
        item.error = undefined;
        item.end = Date.now();

        saveLogs();
    };
    const saveLogs = () => {
        writeFileSync(logsPath, JSON.stringify(logs, undefined, 4));
    };

    return { logs, putLog, logError, logComplete, saveLogs };
}
