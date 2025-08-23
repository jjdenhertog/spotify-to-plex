import {
    handleOneRetryAttempt as handleOneRetryAttemptCore,
    RetryConfig
} from '@spotify-to-plex/plex-helpers';
import { AxiosResponse } from 'axios';

/**
 * Legacy wrapper for handleOneRetryAttempt - maintains backward compatibility
 * @deprecated Use handleOneRetryAttemptWithConfig instead
 */
export async function handleOneRetryAttempt<T = any>(
    request: () => Promise<AxiosResponse<T>>
): Promise<AxiosResponse<T>> {
    return handleOneRetryAttemptCore(request);
}

/**
 * Modern version that accepts retry configuration
 */
export async function handleOneRetryAttemptWithConfig<T = any>(
    request: () => Promise<AxiosResponse<T>>,
    config?: RetryConfig
): Promise<AxiosResponse<T>> {
    return handleOneRetryAttemptCore(request, config);
}