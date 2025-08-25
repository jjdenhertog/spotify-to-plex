import {
    handleOneRetryAttempt as handleOneRetryAttemptCore,
    RetryConfig
} from '@spotify-to-plex/plex-helpers';
import { AxiosResponse } from 'axios';

/**
 * Convenience wrapper for handleOneRetryAttempt
 */
export async function handleOneRetryAttempt<T = any>(
    request: () => Promise<AxiosResponse<T>>
): Promise<AxiosResponse<T>> {
    return handleOneRetryAttemptCore(request);
}

/**
 * Version that accepts retry configuration
 */
export async function handleOneRetryAttemptWithConfig<T = any>(
    request: () => Promise<AxiosResponse<T>>,
    config?: RetryConfig
): Promise<AxiosResponse<T>> {
    return handleOneRetryAttemptCore(request, config);
}