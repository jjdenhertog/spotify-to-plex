import axios from 'axios';
import type { SlskdCredentials } from "../types/SlskdCredentials";

export type SlskdDownloadFile = {
    username: string;
    filename: string;
    size?: number;
    bitRate?: number;
    bitDepth?: number;
    extension?: string;
}

type SlskdDownloadPayload = {
    filename: string;
    size?: number;
}

export async function queueDownload(files: SlskdDownloadFile[], credentials: SlskdCredentials, maxRetries: number = 3) {
    const baseUrl = credentials.baseUrl.endsWith('/') ? credentials.baseUrl.slice(0, -1) : credentials.baseUrl;

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

        // Try to queue this file with retries
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await axios.post(downloadUrl, payload, {
                    headers: {
                        'X-API-Key': credentials.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10_000
                });

                return file;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) 
                    break;

                // Exponential backoff before retry
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * 2 ** attempt, 5000);
                    await new Promise(resolve => { setTimeout(resolve, delay) });
                }
            }
        }

        const errorMsg = lastError?.message || 'Unknown error';
        errors.push(`[${i + 1}/${files.length}] Failed to queue ${file.filename}: ${errorMsg}`);
    }

    throw new Error(`Failed to queue any downloads. Errors:\n${errors.join('\n')}`);
}
