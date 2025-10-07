import { AxiosResponse } from 'axios';
import { RetryConfig } from './RetryConfig';
import { createDelay } from './utils/createDelay';

/**
 * Handles a single retry attempt for HTTP requests
 */
export async function handleOneRetryAttempt<T = any>(
    request: () => Promise<AxiosResponse<T>>,
    config: RetryConfig = {}
): Promise<AxiosResponse<T>> {
    const { retryDelay = 2000 } = config;

    try {
        return await request();
    } catch (_error) {
        console.error('Error in handleOneRetryAttempt', _error)
        
        // Wait before retry
        await createDelay(retryDelay);

        // One more attempt
        return request();
    }
}

