import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { SyncLogCollection } from "@spotify-to-plex/shared-types/common/sync";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export function saveNestedSyncLogs(logs: SyncLogCollection): void {
    const logsPath = join(getStorageDir(), 'sync_log.json');
    writeFileSync(logsPath, JSON.stringify(logs, undefined, 4));
}
