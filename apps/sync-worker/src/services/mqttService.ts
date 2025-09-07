import { logger } from "../utils/logger";
/* eslint-disable custom/no-export-only-files */
/* eslint-disable unicorn/prefer-event-target */
import { EventEmitter } from 'node:events';
import { watch } from 'node:fs';
import { join } from 'node:path';
import { settingsDir } from '@spotify-to-plex/shared-utils/utils/settingsDir';
import { refreshMQTT } from '../jobs/mqtt';

export type MQTTServiceConfig = {
    watchMode: boolean;
    updateInterval: number; // in milliseconds
    enableFileWatching: boolean;
    retryCount: number;
    retryDelay: number;
}

export type MQTTServiceOptions = {
    continuous?: boolean;
    watchFiles?: boolean;
    updateInterval?: number;
    retryCount?: number;
    retryDelay?: number;
}

/**
 * Persistent MQTT service with file watching and auto-update capabilities
 * 
 * Features:
 * - File watching for automatic updates when data changes
 * - Configurable update intervals for periodic refreshes
 * - Robust error handling with retry logic
 * - Clean shutdown handling
 * - Event-driven architecture for extensibility
 */
export class MQTTService extends EventEmitter {
    private readonly config: MQTTServiceConfig;
    private updateTimer: NodeJS.Timeout | null = null;
    private fileWatchers: { close: () => void }[] = [];
    private isRunning = false;
    private isShuttingDown = false;
    private lastUpdate = 0;
    private updateInProgress = false;

    public constructor(options: MQTTServiceOptions = {}) {
        super();
        
        this.config = {
            watchMode: options.continuous ?? true,
            updateInterval: options.updateInterval ?? 5 * 60 * 1000, // 5 minutes default
            enableFileWatching: options.watchFiles ?? true,
            retryCount: options.retryCount ?? 3,
            retryDelay: options.retryDelay ?? 30 * 1000, // 30 seconds
        };

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.shutdown().catch((error: unknown) => {
                this.emit('error', `Shutdown failed: ${String(error)}`);
            });
        });
        process.on('SIGTERM', () => {
            this.shutdown().catch((error: unknown) => {
                this.emit('error', `Shutdown failed: ${String(error)}`);
            });
        });
    }

    /**
     * Start the MQTT service
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            this.emit('warn', 'Service is already running');

            return;
        }

        try {
            this.emit('info', 'Starting MQTT service...');
            this.isRunning = true;

            // Initial MQTT refresh
            await this.performUpdate('initial');

            if (this.config.watchMode) {
                this.setupFileWatching();
                this.setupPeriodicUpdates();
            }

            this.emit('started');
            this.emit('info', 'MQTT service started successfully');

        } catch (error) {
            this.emit('error', `Failed to start MQTT service: ${String(error)}`);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * Stop the MQTT service
     */
    public async stop(): Promise<void> {
        await this.shutdown();
    }

    /**
     * Force an immediate update
     */
    public async forceUpdate(): Promise<void> {
        if (this.updateInProgress) {
            this.emit('warn', 'Update already in progress, skipping');

            return;
        }

        await this.performUpdate('manual');
    }

    /**
     * Get service status
     */
    public getStatus() {
        return {
            isRunning: this.isRunning,
            isShuttingDown: this.isShuttingDown,
            updateInProgress: this.updateInProgress,
            lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : null,
            config: { ...this.config },
            fileWatchers: this.fileWatchers.length,
        };
    }

    private async performUpdate(trigger: 'initial' | 'timer' | 'file-change' | 'manual'): Promise<void> {
        if (this.updateInProgress) {
            this.emit('debug', `Update skipped - already in progress (trigger: ${trigger})`);

            return;
        }

        // Rate limiting - avoid too frequent updates
        const now = Date.now();
        if (trigger === 'file-change' && (now - this.lastUpdate) < 10_000) { // 10 second minimum
            this.emit('debug', 'Update skipped - rate limited');

            return;
        }

        this.updateInProgress = true;
        let attempt = 0;

        while (attempt <= this.config.retryCount) {
            try {
                this.emit('debug', `Starting MQTT update (trigger: ${trigger}, attempt: ${attempt + 1})`);
                
                // Check if we should still proceed (service might be shutting down)
                if (this.isShuttingDown) {
                    this.emit('debug', 'Update cancelled - service shutting down');

                    return;
                }

                await refreshMQTT();
                
                this.lastUpdate = now;
                this.emit('updated', { trigger, timestamp: now });
                this.emit('info', `MQTT update completed successfully (trigger: ${trigger})`);
                
                break; // Success, exit retry loop

            } catch (error) {
                attempt++;
                this.emit('error', `MQTT update failed (attempt ${attempt}/${this.config.retryCount + 1}): ${String(error)}`);

                if (attempt <= this.config.retryCount) {
                    this.emit('info', `Retrying in ${this.config.retryDelay / 1000} seconds...`);
                    await this.delay(this.config.retryDelay);
                } else {
                    this.emit('error', `MQTT update failed after ${this.config.retryCount + 1} attempts`);
                    // Don't throw error - service should continue running
                }
            }
        }

        this.updateInProgress = false;
    }

    private setupFileWatching(): void {
        if (!this.config.enableFileWatching) {
            return;
        }

        const watchPaths = [
            join(settingsDir, 'playlists.json'),
            join(settingsDir, 'track_links.json'),
            join(settingsDir, 'saved_items.json') // Assuming this exists based on savedItemsHelpers
        ];

        this.emit('debug', `Setting up file watchers for: ${watchPaths.join(', ')}`);

        for (const filePath of watchPaths) {
            try {
                const watcher = watch(filePath, { persistent: false }, (eventType) => {
                    if (eventType === 'change') {
                        this.emit('debug', `File change detected: ${filePath}`);
                        this.performUpdate('file-change').catch((error: unknown) => {
                            this.emit('error', `File change update failed: ${String(error)}`);
                        });
                    }
                });

                watcher.on('error', (error) => {
                    this.emit('error', `File watcher error for ${filePath}: ${String(error)}`);
                });

                this.fileWatchers.push(watcher);
                
            } catch (error) {
                this.emit('warn', `Failed to setup file watcher for ${filePath}: ${String(error)}`);
            }
        }

        this.emit('info', `File watching enabled for ${this.fileWatchers.length} files`);
    }

    private setupPeriodicUpdates(): void {
        if (this.config.updateInterval > 0) {
            this.updateTimer = setInterval(() => {
                this.performUpdate('timer').catch((error: unknown) => {
                    this.emit('error', `Timer update failed: ${String(error)}`);
                });
            }, this.config.updateInterval);

            this.emit('info', `Periodic updates enabled (interval: ${this.config.updateInterval / 1000}s)`);
        }
    }

    private async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            return;
        }

        this.isShuttingDown = true;
        this.emit('info', 'Shutting down MQTT service...');

        // Clear timer
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        // Close file watchers
        for (const watcher of this.fileWatchers) {
            try {
                watcher.close();
            } catch (error) {
                this.emit('warn', `Error closing file watcher: ${String(error)}`);
            }
        }
        this.fileWatchers = [];

        // Wait for current update to complete
        let waitCount = 0;
        while (this.updateInProgress && waitCount < 30) { // Max 30 seconds wait
            await this.delay(1000);
            waitCount++;
        }

        this.isRunning = false;
        this.emit('stopped');
        this.emit('info', 'MQTT service stopped');
    }

    private delay(ms: number): Promise<void> {
        return new Promise<void>(resolve => {
            setTimeout(resolve, ms);
        });
    }
}

/**
 * Create and configure an MQTT service instance
 */
export function createMQTTService(options?: MQTTServiceOptions): MQTTService {
    return new MQTTService(options);
}

/**
 * Run MQTT service in continuous mode (for background service)
 */
export async function runMQTTService(options?: MQTTServiceOptions): Promise<MQTTService> {
    const service = createMQTTService(options);

    // Setup event listeners for logging
    service.on('info', (message) => logger.info(`[INFO] ${message}`));
    service.on('warn', (message) => logger.warn(`[WARN] ${message}`));
    service.on('error', (message) => logger.error(`[ERROR] ${message}`));
    service.on('debug', (message) => {
        if (process.env.DEBUG === 'mqtt' || process.env.NODE_ENV === 'development') {
            logger.debug(`[DEBUG] ${message}`);
        }
    });


    await service.start();

    return service;
}