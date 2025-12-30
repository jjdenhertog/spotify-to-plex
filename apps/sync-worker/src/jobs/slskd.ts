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

import { newTrackSearch, setState, clearState } from "@spotify-to-plex/slskd-music-search";
import type { SlskdMusicSearchConfig, SlskdTrack } from "@spotify-to-plex/slskd-music-search";
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { setMusicSearchConfig as setMusicSearchMatchFilters } from "@spotify-to-plex/music-search/functions/setMusicSearchConfig";

type DownloadPayload = { filename: string; size: number; };

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

        // Setup axios instance with API key for download operations
        const baseUrl = settings.url.endsWith('/') ? settings.url.slice(0, -1) : settings.url;
        const axiosInstance = axios.create({
            baseURL: baseUrl,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
        });

        // Load centralized music search configuration
        const musicSearchConfig = await getMusicSearchConfig();
        const { searchApproaches, textProcessing } = musicSearchConfig;

        // Set up match filters (required for music search sorting/matching)
        setMusicSearchMatchFilters(musicSearchConfig);

        // Initialize search state with configuration
        const slskdConfig: SlskdMusicSearchConfig = {
            baseUrl,
            apiKey,
            searchApproaches,
            textProcessing,
            musicSearchConfig,
            maxResultsPerApproach: settings.max_results,
            searchTimeout: settings.search_timeout * 1000,
        };

        setState({ baseUrl, apiKey }, slskdConfig);

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

                console.log(`🔍 Searching for: ${track.artist_name} - ${track.track_name}`);

                // Use the new search package with progressive fallback
                const searchResult = await newTrackSearch(
                    searchApproaches,
                    {
                        id: trackKey,
                        artists: [track.artist_name],
                        title: track.track_name,
                        album: track.album_name || '',
                    },
                    false // analyze=false for first match only
                );

                // Check if we found any results
                if (!searchResult.result || searchResult.result.length === 0) {
                    trackLog.status = 'not_found';
                    trackLog.error = 'No files matched filter criteria after trying all approaches';
                    trackLog.end = Date.now();
                    notFoundCount++;
                    slskdLogs[logId] = trackLog;
                    console.log(`❌ Not found: ${track.artist_name} - ${track.track_name}`);
                    continue;
                }

                // Filter results - skip locked files only
                const candidateFiles: SlskdTrack[] = searchResult.result
                    .filter((file: SlskdTrack) => !file.isLocked)
                    .slice(0, settings.download_attempts); // Limit to download attempts

                if (candidateFiles.length === 0) {
                    trackLog.status = 'not_found';
                    trackLog.error = 'No available files found (all locked)';
                    trackLog.end = Date.now();
                    notFoundCount++;
                    slskdLogs[logId] = trackLog;
                    console.log(`❌ No available files: ${track.artist_name} - ${track.track_name}`);
                    continue;
                }

                console.log(`✓ Found ${candidateFiles.length} candidate(s), attempting download...`);

                // Try to queue download (try each candidate until one succeeds)
                let downloadQueued = false;

                for (let attempt = 0; attempt < candidateFiles.length; attempt++) {
                    const candidate = candidateFiles[attempt];
                    if (!candidate)
                        continue;

                    try {
                        const payload: DownloadPayload[] = [{
                            filename: candidate.filename,
                            size: candidate.size,
                        }];

                        await axiosInstance.post(`/api/v0/transfers/downloads/${candidate.username}`, payload);

                        // Success!
                        trackLog.status = 'queued';
                        trackLog.file_path = candidate.filename;
                        trackLog.file_size = candidate.size;
                        trackLog.download_username = candidate.username;
                        trackLog.end = Date.now();
                        downloadQueued = true;
                        successCount++;
                        slskdLogs[logId] = trackLog;

                        console.log(`✓ Queued download: ${candidate.filename}`);
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

        // Clear search state
        clearState();

        // Save SLSKD logs
        writeFileSync(slskdLogsPath, JSON.stringify(slskdLogs, null, 2));

        // Complete sync log
        logComplete(syncLog);

        console.log(`SLSKD sync complete: ${successCount} queued, ${notFoundCount} not found, ${errorCount} errors`);

        // Mark sync as complete
        completeSyncType('slskd');
    } catch (e: unknown) {
        // Clear search state on error
        clearState();

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
