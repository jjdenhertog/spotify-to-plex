import { settingsDir } from '@spotify-to-plex/shared-utils/utils/settingsDir';
import { SyncLog } from "@spotify-to-plex/shared-types/common/sync";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function getSyncLogs() {
    // Get the logs
    const logsPath = join(settingsDir, 'sync_log.json');
    let logs: SyncLog[] = [];
    if (existsSync(logsPath))
        logs = JSON.parse(readFileSync(logsPath, 'utf8'));
    
    // Log rotation: Keep only last 100 entries and remove logs older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    logs = logs
        .filter(log => log.start > thirtyDaysAgo) // Remove logs older than 30 days
        .slice(-100); // Keep only last 100 entries

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
        // Apply rotation before saving
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        logs = logs
            .filter(log => log.start > thirtyDaysAgo) // Remove logs older than 30 days
            .slice(-100); // Keep only last 100 entries
        
        writeFileSync(logsPath, JSON.stringify(logs, undefined, 4));
    };

    return { logs, putLog, logError, logComplete, saveLogs };
}
