import axios from 'axios';

/**
 * Helper to perform HTTP request with one retry attempt
 * Handles transient errors like 503 (Service Unavailable) and network issues
 */
export async function withRetry<T>(fn: () => Promise<T>, retryDelay: number = 2000) {
    try {
        return await fn();
    } catch (error) {
        // Check if error is retryable (503, 429, network errors)
        const isRetryable = axios.isAxiosError(error) &&
            (error.response?.status === 503 ||
                error.response?.status === 429 ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT');

        if (isRetryable) {
            await new Promise(resolve => { setTimeout(resolve, retryDelay) });

            return fn(); // One retry attempt
        }

        throw error;
    }
}
