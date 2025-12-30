/* eslint-disable custom/no-export-only-files */
import type { SlskdCredentials } from "../types/SlskdCredentials";

export function validateCredentials(credentials: SlskdCredentials) {
    if (!credentials.baseUrl || typeof credentials.baseUrl !== 'string') 
        return false

    if (!credentials.apiKey || typeof credentials.apiKey !== 'string') 
        return false;

    try {
        // eslint-disable-next-line no-new
        new URL(credentials.baseUrl);
    } catch {
        return false;
    }

    return true;
}

export function sanitizeCredentials(credentials: SlskdCredentials): Partial<SlskdCredentials> {
    return {
        baseUrl: credentials.baseUrl,
        username: credentials.username,
        // Hide sensitive data
        apiKey: credentials.apiKey ? '***' : undefined,
        password: credentials.password ? '***' : undefined
    };
}
