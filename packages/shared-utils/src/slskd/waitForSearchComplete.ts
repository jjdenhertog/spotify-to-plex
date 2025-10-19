import { getSearchStatus } from './getSearchStatus';

export type SearchCompleteResult = {
    completed: boolean;
    fileCount: number;
}

/**
 * Wait for a search to complete (recursive polling)
 * Returns object with completion status and file count
 * Throws error if search fails or times out
 */
export async function waitForSearchComplete(
    searchId: string,
    trackDetails: string,
    slskdUrl: string,
    apiKey: string,
    maxRetries: number = 10,
    currentRetry: number = 0,
    retryDelay: number = 20_000
): Promise<SearchCompleteResult> {
    const status = await getSearchStatus(searchId, slskdUrl, apiKey);

    // Search completed successfully with files
    if (status.isComplete && status.fileCount > 0) {
        return {
            completed: true,
            fileCount: status.fileCount
        };
    }

    // Search completed but no available files
    if (status.isComplete && (status.fileCount === 0 || status.fileCount === status.lockedFileCount)) {
        return {
            completed: true,
            fileCount: 0
        };
    }

    // Max retries exceeded
    if (currentRetry >= maxRetries) {
        throw new Error(`Search wasn't completed after ${currentRetry} retries, skipping ${trackDetails}`);
    }

    // Continue waiting
    console.log(`[${currentRetry}/${maxRetries}] Searching for ${trackDetails}`);
    await new Promise<void>(resolve => {
        setTimeout(() => resolve(), retryDelay);
    });

    return waitForSearchComplete(
        searchId,
        trackDetails,
        slskdUrl,
        apiKey,
        maxRetries,
        currentRetry + 1,
        retryDelay
    );
}
