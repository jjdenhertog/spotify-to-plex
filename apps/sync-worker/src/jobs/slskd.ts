/* eslint-disable max-depth */
import { getSlskdSettings } from "@spotify-to-plex/plex-config/functions/getSlskdSettings";
import { getStorageDir } from "@spotify-to-plex/shared-utils/utils/getStorageDir";
import { SlskdSyncLog } from "@spotify-to-plex/shared-types/slskd/SlskdSyncLog";
import { SlskdTrackData } from "@spotify-to-plex/shared-types/slskd/SlskdTrackData";
import axios from "axios";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getNestedSyncLogsForType } from "../utils/getNestedSyncLogsForType";
import { startSyncType } from "../utils/startSyncType";
import { clearSyncTypeLogs } from "../utils/clearSyncTypeLogs";
import { completeSyncType } from "../utils/completeSyncType";
import { errorSyncType } from "../utils/errorSyncType";
import { updateSyncTypeProgress } from "../utils/updateSyncTypeProgress";

// SLSKD API response types based on Go example
type SlskdSearch = {
    id: string;
    searchText: string;
    state: string;
    isComplete: boolean;
    fileCount: number;
    lockedFileCount: number;
    responseCount: number;
    startedAt: string;
    endedAt?: string;
    token: number;
};

type SlskdFile = {
    filename: string;
    size: number;
    extension: string;
    bitRate: number;
    bitDepth: number;
    length: number;
    isLocked: boolean;
};

type SlskdSearchResult = {
    username: string;
    fileCount: number;
    files: SlskdFile[];
    lockedFileCount: number;
    hasFreeUploadSlot: boolean;
    uploadSpeed: number;
    queueLength: number;
};

type DownloadPayload = {
    filename: string;
    size: number;
};

export async function syncSlskd() {
    console.log('Starting SLSKD sync...');

    // Check SLSKD settings
    const settings = await getSlskdSettings();
    if (!settings.enabled) {
        console.log('SLSKD sync is disabled');

        return;
    }

    // Start sync type logging
    startSyncType('slskd');
    clearSyncTypeLogs('slskd');

    try {
        if (!settings.url) {
            console.log('SLSKD URL not configured');

            return;
        }

        const apiKey = process.env.SLSKD_API_KEY;
        if (!apiKey) {
            console.log('SLSKD API key not configured in environment (SLSKD_API_KEY)');

            return;
        }

        // Read missing tracks from JSON file
        const tracksPath = join(getStorageDir(), 'missing_tracks_slskd.json');

        if (!existsSync(tracksPath)) {
            console.log('No missing tracks file found');
            completeSyncType('slskd');

            return;
        }

        // Parse the JSON file
        const content = readFileSync(tracksPath, 'utf8');
        let tracks: SlskdTrackData[] = [];

        try {
            tracks = JSON.parse(content);
        } catch (_e) {
            console.log('Error parsing missing tracks JSON file');
            errorSyncType('slskd', 'Failed to parse missing_tracks_slskd.json');

            return;
        }

        if (!Array.isArray(tracks) || tracks.length === 0) {
            console.log('No tracks to sync');
            completeSyncType('slskd');

            return;
        }

        // Initialize logs
        const { putLog, logComplete } = getNestedSyncLogsForType('slskd');
        const syncLog = putLog('slskd-sync', 'SLSKD Sync');

        // Read existing SLSKD logs
        const slskdLogsPath = join(getStorageDir(), 'slskd_sync_log.json');
        const slskdLogs: Record<string, SlskdSyncLog> = {};

        // Setup axios instance with API key
        const baseUrl = settings.url.endsWith('/') ? settings.url.slice(0, -1) : settings.url;
        const axiosInstance = axios.create({
            baseURL: baseUrl,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
        });

        // Process each track
        let successCount = 0;
        let errorCount = 0;
        let notFoundCount = 0;

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (!track)
                continue;

            // Update progress
            updateSyncTypeProgress('slskd', i + 1, tracks.length);

            const trackKey = `${track.artist_name}|${track.track_name}`;
            const logId = `${Date.now()}-${trackKey}`;

            const trackLog: SlskdSyncLog = {
                id: logId,
                artist_name: track.artist_name,
                track_name: track.track_name,
                start: Date.now(),
                status: 'error',
            };

            try {
                // Skip tracks without proper info
                if (!track.artist_name || !track.track_name) {
                    trackLog.status = 'error';
                    trackLog.error = 'Missing artist or title information';
                    trackLog.end = Date.now();
                    errorCount++;
                    slskdLogs[logId] = trackLog;
                    console.log(`⚠️  Skipping track (missing info): ${track.artist_name} - ${track.track_name}`);
                    continue;
                }

                // STEP 1: Create search
                const searchText = `${track.artist_name} - ${track.track_name}`;
                console.log(`🔍 Searching for: ${searchText}`);

                const searchResponse = await axiosInstance.post<SlskdSearch>('/api/v0/searches', {
                    searchText
                });

                const searchId = searchResponse.data.id;
                trackLog.error = `Search ID: ${searchId}`;

                // STEP 2: Wait for search to complete (with retry logic)
                let searchComplete = false;
                let retryCount = 0;

                while (!searchComplete && retryCount < settings.retry_limit) {
                    await new Promise(resolve => { setTimeout(resolve, settings.search_timeout * 1000) });

                    const statusResponse = await axiosInstance.get<SlskdSearch>(`/api/v0/searches/${searchId}`);
                    const searchStatus = statusResponse.data;

                    if (searchStatus.isComplete) {
                        // Check if we have any available (non-locked) files
                        const availableFileCount = searchStatus.fileCount - searchStatus.lockedFileCount;

                        if (availableFileCount > 0) {
                            searchComplete = true;
                            console.log(`✓ Search complete: found ${searchStatus.fileCount} files (${availableFileCount} available)`);
                        } else {
                            // Search is complete but no available files
                            trackLog.status = 'not_found';
                            trackLog.error = `No available files found (${searchStatus.fileCount} total, ${searchStatus.lockedFileCount} locked)`;
                            trackLog.end = Date.now();
                            notFoundCount++;
                            slskdLogs[logId] = trackLog;

                            // Clean up search
                            await axiosInstance.delete(`/api/v0/searches/${searchId}`).catch(() => { console.log(`❌ Error deleting search: ${searchId}`); });
                            break;
                        }
                    } else {
                        retryCount++;
                        console.log(`⏳ Search in progress... (${retryCount}/${settings.retry_limit})`);
                    }
                }

                if (!searchComplete) {
                    if (retryCount >= settings.retry_limit) {
                        trackLog.status = 'error';
                        trackLog.error = `Search timeout after ${settings.retry_limit} retries`;
                        trackLog.end = Date.now();
                        errorCount++;
                        slskdLogs[logId] = trackLog;

                        // Clean up search
                        await axiosInstance.delete(`/api/v0/searches/${searchId}`).catch(() => { console.log(`❌ Error deleting search: ${searchId}`); });
                    }

                    continue;
                }

                // STEP 3: Collect search results
                const resultsResponse = await axiosInstance.get<SlskdSearchResult[]>(`/api/v0/searches/${searchId}/responses`);
                const searchResults = resultsResponse.data;

                // STEP 4: Filter files based on settings
                const candidateFiles: { file: SlskdFile; username: string }[] = [];

                // Helper function to sanitize names (remove special chars, normalize)
                const sanitizeName = (name: string): string => {
                    return name
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036F]/g, '') // Remove diacritics
                        .replace(/[^\d\sa-z]/g, ' ') // Replace special chars with space
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim();
                };

                const sanitizedArtist = sanitizeName(track.artist_name);
                const sanitizedTitle = sanitizeName(track.track_name);
                const sanitizedAlbum = track.album_name ? sanitizeName(track.album_name) : '';

                for (const result of searchResults) {
                    if (result.fileCount > 0 && result.hasFreeUploadSlot) {
                        for (const file of result.files) {
                            // Check if file is locked first
                            if (file.isLocked) {
                                continue;
                            }

                            // Extract extension
                            let extension = file.extension.toLowerCase().replace(/^\./, '');
                            if (!extension && file.filename) {
                                const match = /\.([^.]+)$/.exec(file.filename);
                                extension = match ? match[1]?.toLowerCase() || '' : '';
                            }

                            // Check if extension is allowed
                            if (!settings.allowed_extensions.includes(extension)) {
                                continue;
                            }

                            // TODO: Re-enable when Track type includes duration_ms
                            // Check track duration (if available) - skip if difference > max_length_difference
                            // if (track.duration && track.duration > 0 && file.length > 0) {
                            //     const trackLengthSeconds = Math.floor(track.duration / 1000);
                            //     const lengthDiff = Math.abs(trackLengthSeconds - file.length);
                            //     if (lengthDiff > settings.max_length_difference) {
                            //         continue;
                            //     }
                            // }

                            // Check bitrate (skip if 0, as it means not applicable or not reported)
                            if (settings.min_bitrate > 0 && file.bitRate > 0 && file.bitRate < settings.min_bitrate) {
                                continue;
                            }

                            // Check bit depth (skip if 0, as it means not applicable or not reported)
                            if (settings.min_bitdepth > 0 && file.bitDepth > 0 && file.bitDepth < settings.min_bitdepth) {
                                continue;
                            }

                            // Check if filename contains (artist OR album) AND title
                            const sanitizedFilename = sanitizeName(file.filename);
                            const hasArtistOrAlbum = sanitizedFilename.includes(sanitizedArtist) ||
                                (sanitizedAlbum && sanitizedFilename.includes(sanitizedAlbum));
                            const hasTitle = sanitizedFilename.includes(sanitizedTitle);

                            if (hasArtistOrAlbum && hasTitle) {
                                candidateFiles.push({ file, username: result.username });

                                // Limit to download attempts
                                if (candidateFiles.length >= settings.download_attempts) {
                                    break;
                                }
                            }
                        }

                        if (candidateFiles.length >= settings.download_attempts) {
                            break;
                        }
                    }
                }

                if (candidateFiles.length === 0) {
                    trackLog.status = 'not_found';
                    trackLog.error = 'No files matched filter criteria';
                    trackLog.end = Date.now();
                    notFoundCount++;
                    slskdLogs[logId] = trackLog;

                    // Clean up search
                    await axiosInstance.delete(`/api/v0/searches/${searchId}`).catch(() => { console.log(`❌ Error deleting search: ${searchId}`); });
                    continue;
                }

                // STEP 5: Queue download (try each candidate until one succeeds)
                let downloadQueued = false;

                for (let attempt = 0; attempt < candidateFiles.length; attempt++) {
                    const candidate = candidateFiles[attempt];
                    if (!candidate)
                        continue;

                    try {
                        const payload: DownloadPayload[] = [{
                            filename: candidate.file.filename,
                            size: candidate.file.size,
                        }];

                        await axiosInstance.post(`/api/v0/transfers/downloads/${candidate.username}`, payload);

                        // Success!
                        trackLog.status = 'queued';
                        trackLog.file_path = candidate.file.filename;
                        trackLog.file_size = candidate.file.size;
                        trackLog.download_username = candidate.username;
                        trackLog.end = Date.now();
                        downloadQueued = true;
                        successCount++;
                        slskdLogs[logId] = trackLog;

                        console.log(`✓ Queued download: ${candidate.file.filename}`);
                        break;
                    } catch (downloadError: any) {
                        console.log(`⚠️  Failed to queue download (attempt ${attempt + 1}/${candidateFiles.length}): ${downloadError.message}`);
                    }
                }

                if (!downloadQueued) {
                    trackLog.status = 'error';
                    trackLog.error = 'Failed to queue any download';
                    trackLog.end = Date.now();
                    errorCount++;
                    slskdLogs[logId] = trackLog;
                }

                // Clean up search
                await axiosInstance.delete(`/api/v0/searches/${searchId}`).catch(() => { console.log(`❌ Error deleting search: ${searchId}`); });

            } catch (error: any) {
                trackLog.status = 'error';
                trackLog.error = error.message || 'Unknown error';
                trackLog.end = Date.now();
                errorCount++;
                slskdLogs[logId] = trackLog;

                console.log(`❌ Error processing track: ${error.message}`);
            }

            // Rate limit: 1 second delay between tracks
            await new Promise(resolve => { setTimeout(resolve, 1000) });
        }

        // Save SLSKD logs
        writeFileSync(slskdLogsPath, JSON.stringify(slskdLogs, null, 2));

        // Complete sync log
        logComplete(syncLog);

        console.log(`SLSKD sync complete: ${successCount} queued, ${notFoundCount} not found, ${errorCount} errors`);

        // Mark sync as complete
        completeSyncType('slskd');
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        errorSyncType('slskd', message);
        throw e;
    }
}

function run() {
    syncSlskd()
        .then(() => {
            console.log('SLSKD sync completed');
        })
        .catch((e: unknown) => {
            console.error('SLSKD sync failed:', e);
        });
}

// Only run if this file is executed directly, not when imported
// eslint-disable-next-line unicorn/prefer-module
if (require.main === module) {
    run();
}
