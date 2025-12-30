import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { SyncTypeLogCollection } from "@spotify-to-plex/shared-types/common/sync";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export function saveSyncTypeLogs(logs: SyncTypeLogCollection) {
    const logsPath = join(getStorageDir(), 'sync_type_log.json');
    writeFileSync(logsPath, JSON.stringify(logs, undefined, 4));
}
