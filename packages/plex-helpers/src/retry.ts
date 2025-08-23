import { AxiosResponse } from 'axios';
import { RetryConfig } from './types';
import { createDelay } from './utils';

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
  } catch (error) {
    // Wait before retry
    await createDelay(retryDelay);
    
    // One more attempt
    return await request();
  }
}

/**
 * Handles multiple retry attempts for HTTP requests
 */
export async function handleMultipleRetries<T = any>(
  request: () => Promise<AxiosResponse<T>>,
  config: RetryConfig = {}
): Promise<AxiosResponse<T>> {
  const { maxRetries = 3, retryDelay = 2000 } = config;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        await createDelay(retryDelay * (attempt + 1)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}