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

// Non-retriable error patterns - these indicate the file/user is unavailable, not a transient issue
const NON_RETRIABLE_PATTERNS = [
    'File not shared',
    'Transfer rejected',
    'User is offline',
    'user is not online',
    'not sharing',
    'file not found',
    'access denied'
];

function isNonRetriableError(responseData: unknown): boolean {
    const responseStr = typeof responseData === 'string' ? responseData : JSON.stringify(responseData || '');
    return NON_RETRIABLE_PATTERNS.some(pattern => responseStr.toLowerCase().includes(pattern.toLowerCase()));
}

function isDuplicateTransferError(responseData: unknown): boolean {
    const responseStr = typeof responseData === 'string' ? responseData : JSON.stringify(responseData || '');
    return responseStr.includes('already in progress') || responseStr.includes('DuplicateTransferException');
}

export async function queueDownload(files: SlskdDownloadFile[], credentials: SlskdCredentials, maxRetries: number = 3) {
    const baseUrl = credentials.baseUrl.endsWith('/') ? credentials.baseUrl.slice(0, -1) : credentials.baseUrl;

    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file)
            continue;

        // URL-encode the username to handle special characters
        const encodedUsername = encodeURIComponent(file.username);
        const downloadUrl = `${baseUrl}/api/v0/transfers/downloads/${encodedUsername}`;
        const payload: SlskdDownloadPayload[] = [{
            filename: file.filename,
            size: file.size
        }];

        console.log(`[SLSKD Queue] Trying source ${i + 1}/${files.length}: ${file.username} - ${file.filename}`);

        // Try to queue this file with retries (only for transient errors)
        let lastError: Error | null = null;
        let shouldTryNextFile = false;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await axios.post(downloadUrl, payload, {
                    headers: {
                        'X-API-Key': credentials.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10_000
                });

                console.log(`[SLSKD Queue] Successfully queued from ${file.username}: ${file.filename}`);
                return file;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (axios.isAxiosError(error)) {
                    const responseData = error.response?.data;

                    // Check for duplicate transfer error - treat as success since file is already queued
                    if (isDuplicateTransferError(responseData)) {
                        console.log(`[SLSKD Queue] File already queued, treating as success: ${file.filename}`);
                        return file;
                    }

                    // Check for non-retriable errors - skip retries and try next file
                    if (isNonRetriableError(responseData)) {
                        const responseStr = typeof responseData === 'string' ? responseData : JSON.stringify(responseData || '');
                        console.log(`[SLSKD Queue] Non-retriable error from ${file.username}, trying next source: ${responseStr}`);
                        shouldTryNextFile = true;
                        break;
                    }

                    // Log other errors
                    console.error(`[SLSKD Queue] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        responseData,
                        message: error.message
                    });
                }

                // Don't retry for client errors (4xx)
                if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500)
                    break;

                // Exponential backoff before retry (only for transient errors)
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * 2 ** attempt, 5000);
                    await new Promise(resolve => { setTimeout(resolve, delay) });
                }
            }
        }

        // If we should try the next file (non-retriable error), continue without adding to errors array
        if (shouldTryNextFile) {
            errors.push(`[${i + 1}/${files.length}] ${file.username}: Source unavailable, skipped`);
            continue;
        }

        const errorMsg = lastError?.message || 'Unknown error';
        errors.push(`[${i + 1}/${files.length}] ${file.username}: ${errorMsg}`);
    }

    throw new Error(`Failed to queue from ${files.length} source(s):\n${errors.join('\n')}`);
}
