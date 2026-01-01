import axios, { type AxiosError } from 'axios';
import type { SlskdCredentials } from "../types/SlskdCredentials";
import type { SlskdSearchRequest } from "../types/SlskdSearchRequest";

////////////////////////////////////////////
// Default configurations
////////////////////////////////////////////
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10_000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

const DEFAULT_POLLING_CONFIG: PollingConfig = {
    maxWaitTime: 30_000,
    initialInterval: 200,
    maxInterval: 1000,
    backoffMultiplier: 1.3
};

////////////////////////////////////////////
// API functions
////////////////////////////////////////////
export async function submitSearch(credentials: SlskdCredentials, request: SlskdSearchRequest, retryConfig?: Partial<RetryConfig>) {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    const searchId = await executeWithRetry(
        async () => {
            const client = createApiClient(credentials);
            const response = await client.post('/api/v0/searches', {
                searchText: request.query,
                filterResponses: true,
                maximumPeerQueueLength: 1_000_000,
                minimumPeerUploadSpeed: 0,
                minimumResponseFileCount: 1,
                responseLimit: request.limit || 100,
                timeout: request.timeout || 30_000
            });

            if (!response.data?.id)
                throw new Error('No search ID returned from API');

            console.log(`[SLSKD API] Search created: ${response.data.id} for query: "${request.query}"`);

            return response.data.id;
        },
        'Submit search',
        config
    );

    return searchId;
}


export async function testConnection(credentials: SlskdCredentials, retryConfig?: Partial<RetryConfig>) {
    try {
        const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
        await executeWithRetry(
            async () => {
                const client = createApiClient(credentials);
                const response = await client.get('/api/v0/application');

                if (response.status !== 200)
                    throw new Error(`Unexpected status code: ${response.status}`);

                return response;
            },
            'Connection test',
            config
        );

        return true;
    } catch (error) {
        console.error('[SLSKD API] Connection test failed:', error);

        return false;
    }
}

export async function waitForSearch(credentials: SlskdCredentials, searchId: string, pollingConfig?: Partial<PollingConfig>, retryConfig?: Partial<RetryConfig>) {
    const config = { ...DEFAULT_POLLING_CONFIG, ...pollingConfig };
    const startTime = Date.now();
    let currentInterval = config.initialInterval;
    let pollCount = 0;

    while (Date.now() - startTime < config.maxWaitTime) {
        pollCount++;

        const status = await getSearchStatus(credentials, searchId, retryConfig);
        const stateStr = status.state || '';

        if (stateStr.includes('Completed'))
            return getSearchResponses(credentials, searchId, retryConfig);

        if (stateStr.includes('Errored'))
            throw new Error(`Search ${searchId} failed with state: ${stateStr}`);

        if (stateStr.includes('Cancelled'))
            throw new Error(`Search ${searchId} was cancelled`);

        const delay = currentInterval;
        await new Promise(resolve => { setTimeout(resolve, delay) });
        currentInterval = Math.min(currentInterval * config.backoffMultiplier, config.maxInterval);
    }

    throw new Error(`Search ${searchId} timed out after ${config.maxWaitTime}ms (${pollCount} polls)`);
}

export async function cancelSearch(credentials: SlskdCredentials, searchId: string, retryConfig?: Partial<RetryConfig>) {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    await executeWithRetry(
        async () => {
            const client = createApiClient(credentials);
            await client.delete(`/api/v0/searches/${searchId}`);
        },
        `Cancel search (${searchId})`,
        config
    );
}

////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////
function createApiClient(credentials: SlskdCredentials, timeout = 30_000) {
    return axios.create({
        baseURL: credentials.baseUrl,
        headers: {
            'X-API-Key': credentials.apiKey,
            'Content-Type': 'application/json'
        },
        timeout
    });
}

function calculateBackoffDelay(attempt: number, config: RetryConfig) {
    const exponentialDelay = Math.min(
        config.initialDelay * config.backoffMultiplier ** attempt,
        config.maxDelay
    );
    const jitter = exponentialDelay * (0.75 + Math.random() * 0.5);

    return Math.floor(jitter);
}

function isRetryableError(error: unknown, config: RetryConfig): boolean {
    if (!axios.isAxiosError(error))
        return false;

    const axiosError = error as AxiosError;
    if (!axiosError.response && axiosError.code !== 'ECONNABORTED')
        return true;

    if (axiosError.response?.status)
        return config.retryableStatusCodes.includes(axiosError.response.status);

    return false;
}

async function executeWithRetry<T>(operation: () => Promise<T>, operationName: string, config: RetryConfig = DEFAULT_RETRY_CONFIG) {
    let lastError: unknown;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            if (attempt < config.maxRetries && isRetryableError(error, config)) {
                const delay = calculateBackoffDelay(attempt, config);


                await new Promise(resolve => { setTimeout(resolve, delay) });
                continue;
            }

            break;
        }
    }

    const axiosError = axios.isAxiosError(lastError) ? lastError as AxiosError : null;
    const errorMessage = axiosError?.message || String(lastError);

    throw new Error(`${operationName} failed after ${config.maxRetries + 1} attempts: ${errorMessage}`);
}

async function getSearchStatus(credentials: SlskdCredentials, searchId: string, retryConfig?: Partial<RetryConfig>) {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    return executeWithRetry(
        async () => {
            const client = createApiClient(credentials);
            const response = await client.get(`/api/v0/searches/${searchId}`);

            if (!response.data)
                throw new Error(`No data returned for search ${searchId}`);

            return response.data;
        },
        `Get search status (${searchId})`,
        config
    );
}

async function getSearchResponses(credentials: SlskdCredentials, searchId: string, retryConfig?: Partial<RetryConfig>) {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    return executeWithRetry(
        async () => {
            const client = createApiClient(credentials);
            const response = await client.get(`/api/v0/searches/${searchId}/responses`);

            if (!response.data)
                throw new Error(`No responses returned for search ${searchId}`);

            const userResponses: SlskdUserResponse[] = Array.isArray(response.data) ? response.data : [];

            const allFiles = userResponses.flatMap(userResponse =>
                (userResponse.files || []).map(file => ({
                    ...file,
                    username: userResponse.username,
                    isLocked: file.isLocked ?? false
                }))
            );

            return {
                id: searchId,
                query: '',
                state: 'Completed' as const,
                files: allFiles,
                fileCount: allFiles.length,
                lockedFileCount: allFiles.filter(f => f.isLocked).length,
                responseCount: userResponses.length,
                startedAt: new Date().toISOString()
            };
        },
        `Get search responses (${searchId})`,
        config
    );
}

////////////////////////////////////////////
// Types
////////////////////////////////////////////
type SlskdUserResponse = {
    username: string;
    hasFreeUploadSlot: boolean;
    uploadSpeed: number;
    queueLength: number;
    files: {
        filename: string;
        size: number;
        extension: string;
        bitRate?: number;
        sampleRate?: number;
        bitDepth?: number;
        length?: number;
        isLocked?: boolean;
        attributes?: { type: number; value: number }[];
    }[];
}

type RetryConfig = {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableStatusCodes: number[];
}

type PollingConfig = {
    maxWaitTime: number;
    initialInterval: number;
    maxInterval: number;
    backoffMultiplier: number;
}
