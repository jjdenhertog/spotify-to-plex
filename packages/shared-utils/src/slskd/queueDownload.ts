import axios from 'axios';
import type { SlskdCollectedFile, SlskdDownloadPayload } from './types';
import { withRetry } from '../lidarr/utils/withRetry';

/**
 * Queue files for download
 * POST /api/v0/transfers/downloads/{username}
 * Attempts to queue each file until one succeeds
 * Returns the successfully queued file or throws if all fail
 */
export async function queueDownload(
    files: SlskdCollectedFile[],
    slskdUrl: string,
    apiKey: string
): Promise<SlskdCollectedFile> {
    const baseUrl = slskdUrl.endsWith('/') ? slskdUrl.slice(0, -1) : slskdUrl;

    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file)
            continue;

        const downloadUrl = `${baseUrl}/api/v0/transfers/downloads/${file.username}`;

        const payload: SlskdDownloadPayload[] = [{
            filename: file.filename,
            size: file.size
        }];

        try {
            await withRetry(
                () => axios.post(downloadUrl, payload, {
                    headers: {
                        'X-API-Key': apiKey,
                        'Content-Type': 'application/json'
                    }
                })
            );

            // Success - return the file that was queued
            return file;

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`[${i + 1}/${files.length}] Failed to queue ${file.filename}: ${errorMsg}`);
            console.log(errors.at(-1));
            continue;
        }
    }

    // All attempts failed
    throw new Error(`Failed to queue any downloads. Errors:\n${errors.join('\n')}`);
}
