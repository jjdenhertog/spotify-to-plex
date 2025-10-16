import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';
import { getById } from '@spotify-to-plex/plex-music-search/functions/getById';
import { PlexMusicSearchConfig } from '@spotify-to-plex/plex-music-search/types/PlexMusicSearchConfig';
import { SavedItem } from '@spotify-to-plex/shared-types/spotify/SavedItem';
import { PlaylistData } from '@spotify-to-plex/shared-types/dashboard/PlaylistData';
import { getNestedSyncLogsForType } from '../utils/getNestedSyncLogsForType';
import { startSyncType } from '../utils/startSyncType';
import { clearSyncTypeLogs } from '../utils/clearSyncTypeLogs';
import { completeSyncType } from '../utils/completeSyncType';
import { errorSyncType } from '../utils/errorSyncType';
import { updateSyncTypeProgress } from '../utils/updateSyncTypeProgress';
import { loadMQTTConfig } from '../services/mqtt/config';
import { createMQTTClient } from '../services/mqtt/createMQTTClient';
import { loadMQTTData } from '../services/mqtt/loadMQTTData';
import { findPlaylistPlexId } from '../services/mqtt/findPlaylistPlexId';
import { findAlbumPlexId } from '../services/mqtt/findAlbumPlexId';
import { extractPlexMediaId } from '../services/mqtt/extractPlexMediaId';
import { buildEntity } from '../services/mqtt/buildEntity';
import { createMQTTPublisher } from '../services/mqtt/createMQTTPublisher';
import { createEntityId } from '../services/mqtt/createEntityId';
import { createDiscoveryTopic } from '../services/mqtt/createDiscoveryTopic';
import { createStateTopic } from '../services/mqtt/createStateTopic';
import { getCategoriesDiscoveryTopic } from '../services/mqtt/getCategoriesDiscoveryTopic';
import { getCategoriesStateTopic } from '../services/mqtt/getCategoriesStateTopic';
import { loadPreviousItems } from '../services/mqtt/loadPreviousItems';
import { savePublishedItems } from '../services/mqtt/savePublishedItems';
import { findItemsToRemove } from '../services/mqtt/findItemsToRemove';
import { writeDryRunManifest } from '../services/mqtt/writeDryRunManifest';
import { PublishedItem, TrackLink, MQTTEntity } from '../services/mqtt/types';

/**
 * Main MQTT sync function
 * Publishes Plex playlist and album data to Home Assistant via MQTT Discovery
 */
export async function syncMQTT() {
    // Start sync type logging
    startSyncType('mqtt');
    clearSyncTypeLogs('mqtt');

    const { putLog, logError, logComplete } = getNestedSyncLogsForType('mqtt');

    // Check for dry-run mode
    const isDryRun = process.env.MQTT_DRY_RUN === 'true';
    console.log('[MQTT] Starting MQTT publish job...');

    // Load MQTT configuration
    const mqttConfig = loadMQTTConfig();

    // Get Plex settings
    const settings = await getSettings();
    if (!settings.uri || !settings.token)
        throw new Error('No Plex connection found');

    const plexConfig: PlexMusicSearchConfig = {
        uri: settings.uri,
        token: settings.token
    };

    // Connect to MQTT broker (skip in dry-run mode)
    let client;
    if (!isDryRun) {
        client = createMQTTClient(mqttConfig);

        try {
            await client.connect();
        } catch {
            console.error('[MQTT] ERROR: Failed to connect to MQTT broker');
            throw new Error('Failed to connect to MQTT broker');
        }
    }

    try {
        // Load data files
        const { savedItems, playlists, trackLinks } = loadMQTTData();

        console.log(`[MQTT] Processing ${savedItems.length} saved items with categories...`);

        // Load previously published items for cleanup
        const previouslyPublished = loadPreviousItems();

        // Create MQTT publisher (only if not dry-run)
        let publisher = null;
        if (!isDryRun && client)
            publisher = createMQTTPublisher(client, mqttConfig.topicPrefix, mqttConfig.discoveryPrefix);

        // Process items
        const currentPublished: PublishedItem[] = [];
        const categories = new Set<string>();
        let successCount = 0;
        let errorCount = 0;
        const countByType = { playlists: 0, albums: 0, 'plex-media': 0 };

        // For dry-run manifest
        const dryRunEntities: {
            entity: MQTTEntity;
            discoveryTopic: string;
            stateTopic: string;
            published: PublishedItem;
        }[] = [];

        for (let i = 0; i < savedItems.length; i++) {
            const item = savedItems[i];
            if (!item?.label)
                continue;

            // Update progress
            updateSyncTypeProgress('mqtt', i + 1, savedItems.length);

            const itemLog = putLog(`mqtt_${item.id}`, item.title);
            categories.add(item.label);

            try {
                // Determine Plex ID based on type
                const plexId = resolvePlexId(item, playlists, trackLinks);
                if (!plexId) {
                    console.warn(`[MQTT] Warning: No Plex ID found for ${item.type} "${item.title}" (${item.id}), skipping`);
                    logError(itemLog, `No Plex ID mapping found`);
                    errorCount++;
                    continue;
                }

                // Fetch Plex metadata
                const isPlaylist = item.type === 'spotify-playlist' || (item.type === 'plex-media' && item.uri?.includes('/playlists/'));
                const plexEndpoint = isPlaylist ? `/playlists/${plexId}` : `/library/metadata/${plexId}`;

                let plexMetadata;
                try {
                    plexMetadata = await getById(plexConfig, plexEndpoint);
                } catch (error) {
                    console.warn(`[MQTT] Warning: Failed to fetch Plex metadata for "${item.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
                    logError(itemLog, `Failed to fetch Plex metadata`);
                    errorCount++;
                    continue;
                }

                // Build entity
                const entity = buildEntity(item, plexId, plexMetadata.image || '');

                // Publish entity or collect for dry-run
                if (isDryRun) {
                    // Collect entity data for manifest
                    const entityId = createEntityId(entity.id, mqttConfig.topicPrefix);
                    const discoveryTopic = createDiscoveryTopic(entityId, mqttConfig.discoveryPrefix);
                    const stateTopic = createStateTopic(entity.id, mqttConfig.topicPrefix);

                    const published = {
                        id: entity.id,
                        entity_id: entityId,
                        category: entity.category,
                    };
                    dryRunEntities.push({ entity, discoveryTopic, stateTopic, published });
                    currentPublished.push(published);
                    console.log(`[DRY-RUN] Would publish: ${item.title} [${item.type}] (${item.label})`);

                }

                if (publisher) {
                    const publishedItem = await publisher.publishEntity(entity);
                    currentPublished.push(publishedItem);
                    console.log(`[MQTT] Published: ${item.title} [${item.type}] (${item.label})`);
                }

                // Update counters
                successCount++;
                switch (item.type) {
                    case 'spotify-playlist': {
                        countByType.playlists++;

                        break;
                    }
                    case 'spotify-album': {
                        countByType.albums++;

                        break;
                    }
                    case 'plex-media': {
                        countByType['plex-media']++;

                        break;
                    }
                }

                logComplete(itemLog);

            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[MQTT] Error publishing "${item.title}": ${message}`);
                logError(itemLog, `Failed to publish: ${message}`);
                errorCount++;
            }
        }

        // Publish categories entity
        const categoriesArray = Array.from(categories).sort();
        const categoriesData = {
            list: categoriesArray,
            discoveryTopic: getCategoriesDiscoveryTopic(mqttConfig.topicPrefix, mqttConfig.discoveryPrefix),
            stateTopic: getCategoriesStateTopic(mqttConfig.topicPrefix),
        };

        if (categories.size > 0 && publisher)
            await publisher.publishCategories(categoriesArray);

        // Cleanup removed entities
        const toRemove = findItemsToRemove(previouslyPublished, currentPublished);
        if (toRemove.length > 0) {
            if (isDryRun) {
                console.log(`[DRY-RUN] Would remove ${toRemove.length} unused entities`);
            } else if (publisher) {
                console.log(`[MQTT] Removing ${toRemove.length} unused entities...`);
                await publisher.removeEntities(toRemove);
            }
        }

        // Save or generate manifest
        if (isDryRun) {
            // Write dry-run manifest
            writeDryRunManifest(
                mqttConfig,
                dryRunEntities,
                categoriesData,
                { removedIds: toRemove, removedCount: toRemove.length },
                {
                    totalProcessed: savedItems.length,
                    successCount,
                    errorCount,
                    categoriesCount: categories.size,
                    byType: countByType,
                }
            );
        } else {
            // Save current published items
            savePublishedItems(currentPublished);

            // Summary
            console.log(`[MQTT] Successfully published ${successCount} items (${countByType.playlists} playlists, ${countByType.albums} albums, ${countByType['plex-media']} plex media)`);
        }

        // Mark sync as complete
        completeSyncType('mqtt');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[MQTT] ERROR: ${message}`);
        errorSyncType('mqtt', message);
        throw error;
    } finally {
        if (!isDryRun && client)
            await client.disconnect();
    }
}

/**
 * Helper function to resolve Plex ID from SavedItem
 */
function resolvePlexId(item: SavedItem, playlists: PlaylistData, trackLinks: TrackLink[]): string | null {

    switch (item.type) {
        case 'spotify-playlist':
            return findPlaylistPlexId(item.id, playlists);
        case 'spotify-album':
            const plexPath = findAlbumPlexId(item.id, trackLinks);
            if (plexPath) {
                const match = /\/library\/metadata\/(\d+)/.exec(plexPath);

                return match?.[1] ?? null;
            }

            return null;
        case 'plex-media':
            return extractPlexMediaId(item.uri);
        default:
            return null;
    }
}

/**
 * Runner function
 */
function run() {
    console.log('Start MQTT sync');
    syncMQTT()
        .then(() => {
            console.log('MQTT sync complete');
        })
        .catch((e: unknown) => {
            console.error('MQTT sync failed:', e);
        });
}

// Only run if this file is executed directly, not when imported
// eslint-disable-next-line unicorn/prefer-module
if (require.main === module) {
    run();
}
