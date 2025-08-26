#!/usr/bin/env node

/**
 * MQTT Background Service - Dedicated entry point for MQTT background service
 * 
 * This service runs continuously and monitors for changes to publish MQTT updates
 * for Home Assistant integration. It supports both file watching and periodic updates.
 */

import { runMQTTService, MQTTServiceOptions } from './services/mqttService';

type CLIOptions = {
    continuous: boolean;
    watchFiles: boolean;
    updateInterval: number;
    retryCount: number;
    retryDelay: number;
    debug: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = {
        continuous: true,
        watchFiles: true,
        updateInterval: 5 * 60 * 1000, // 5 minutes
        retryCount: 3,
        retryDelay: 30 * 1000, // 30 seconds
        debug: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
            case '--no-watch':
            case '--disable-watch':
                options.watchFiles = false;
                break;

            case '--one-shot':
            case '--no-continuous':
                options.continuous = false;
                break;

            case '--interval':
                if (nextArg && !isNaN(Number(nextArg))) {
                    options.updateInterval = Number(nextArg) * 1000; // Convert to ms

                    i++; // Skip next arg
                }

                break;

            case '--retry-count':
                if (nextArg && !isNaN(Number(nextArg))) {
                    options.retryCount = Number(nextArg);

                    i++; // Skip next arg
                }

                break;

            case '--retry-delay':
                if (nextArg && !isNaN(Number(nextArg))) {
                    options.retryDelay = Number(nextArg) * 1000; // Convert to ms

                    i++; // Skip next arg
                }

                break;

            case '--debug':
            case '-d':
                options.debug = true;
                break;

            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
                break;
        }
    }

    return options;
}

/**
 * Display help information
 */
function showHelp() {
    console.log(`
MQTT Background Service - Spotify-to-Plex MQTT Publisher

Usage: mqtt-service [options]

Options:
  --no-watch           Disable file watching (only use periodic updates)
  --one-shot           Run once and exit (no continuous mode)
  --interval <seconds> Update interval in seconds (default: 300)
  --retry-count <n>    Number of retry attempts on failure (default: 3)
  --retry-delay <sec>  Delay between retries in seconds (default: 30)
  --debug, -d          Enable debug logging
  --help, -h           Show this help message

Environment Variables:
  MQTT_BROKER_URL      MQTT broker connection URL (required)
  MQTT_USERNAME        MQTT broker username (required)
  MQTT_PASSWORD        MQTT broker password (required)
  DEBUG=mqtt           Enable debug logging via environment

Examples:
  # Run with default settings (continuous, file watching, 5min intervals)
  mqtt-service

  # Run with custom update interval (10 minutes)
  mqtt-service --interval 600

  # Run once without file watching
  mqtt-service --one-shot --no-watch

  # Run with debug logging
  mqtt-service --debug

Service Features:
  - File watching for automatic updates when data changes
  - Periodic updates with configurable intervals
  - Robust error handling with configurable retry logic
  - Graceful shutdown on SIGINT/SIGTERM
  - Home Assistant MQTT discovery integration
`);
}

/**
 * Validate environment variables
 */
function validateEnvironment(): void {
    const required = ['MQTT_BROKER_URL', 'MQTT_USERNAME', 'MQTT_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('Error: Missing required environment variables:');

        for (const key of missing) {
            console.error(`  - ${key}`);
        }

        console.error('\nPlease set these environment variables before starting the service.');
        process.exit(1);
    }
}

/**
 * Main entry point
 */
async function main() {
    const options = parseArgs();

    // Setup debug logging if requested
    if (options.debug) {
        process.env.DEBUG = 'mqtt';
        process.env.NODE_ENV = 'development';
    }

    // Validate environment
    validateEnvironment();

    console.log('🎵 Starting MQTT Background Service for Spotify-to-Plex...');
    console.log(`Configuration:
  - Continuous mode: ${options.continuous}
  - File watching: ${options.watchFiles}
  - Update interval: ${options.updateInterval / 1000}s
  - Retry attempts: ${options.retryCount}
  - Retry delay: ${options.retryDelay / 1000}s
  - Debug logging: ${options.debug}
`);


    const serviceOptions: MQTTServiceOptions = {
        continuous: options.continuous,
        watchFiles: options.watchFiles,
        updateInterval: options.updateInterval,
        retryCount: options.retryCount,
        retryDelay: options.retryDelay,
    };

    try {
        const service = await runMQTTService(serviceOptions);

        // If one-shot mode, wait for initial update and exit
        if (!options.continuous) {
            console.log('✅ One-shot mode: Initial MQTT update completed');
            await service.stop();
            process.exit(0);
        }

        // In continuous mode, keep running until interrupted
        console.log('✅ MQTT service is running in continuous mode...');
        console.log('   Press Ctrl+C to stop');

        // Keep the process alive in continuous mode
        return await new Promise<void>((resolve) => {
            service.on('stopped', () => {
                console.log('🛑 MQTT service stopped');
                resolve();
            });
        });
    } catch (error) {
        console.error('❌ Failed to start MQTT service:', error);
        process.exit(1);
    }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run main if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    await main();
}

export { main as runMQTTServiceCLI };