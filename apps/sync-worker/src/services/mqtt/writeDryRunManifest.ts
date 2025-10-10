import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { MQTTConfig, MQTTEntity, PublishedItem } from './types';

type DryRunManifest = {
  timestamp: string;
  mode: 'DRY_RUN';
  config: {
    brokerUrl: string;
    topicPrefix: string;
    discoveryPrefix: string;
  };
  entities: {
    entity: MQTTEntity;
    discoveryTopic: string;
    stateTopic: string;
    published: PublishedItem;
  }[];
  categories: {
    list: string[];
    discoveryTopic: string;
    stateTopic: string;
  };
  cleanup: {
    removedIds: string[];
    removedCount: number;
  };
  statistics: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    categoriesCount: number;
    byType: {
      playlists: number;
      albums: number;
      'plex-media': number;
    };
  };
};

/**
 * Write dry-run manifest to file
 * Creates a detailed JSON manifest of what would be published to MQTT
 */
export function writeDryRunManifest(
    config: MQTTConfig,
    entities: { entity: MQTTEntity; discoveryTopic: string; stateTopic: string; published: PublishedItem }[],
    categories: { list: string[]; discoveryTopic: string; stateTopic: string },
    cleanup: { removedIds: string[]; removedCount: number },
    statistics: {
        totalProcessed: number;
        successCount: number;
        errorCount: number;
        categoriesCount: number;
        byType: { playlists: number; albums: number; 'plex-media': number };
    }
): void {
    const manifest: DryRunManifest = {
        timestamp: new Date().toISOString(),
        mode: 'DRY_RUN',
        config: {
            brokerUrl: config.brokerUrl,
            topicPrefix: config.topicPrefix,
            discoveryPrefix: config.discoveryPrefix,
        },
        entities,
        categories,
        cleanup,
        statistics,
    };

    const storageDir = getStorageDir();
    const manifestPath = join(storageDir, 'mqtt_dry_run_manifest.json');

    try {
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(`\n📝 [DRY-RUN] Manifest written to: ${manifestPath}`);
        console.log(`\n📊 [DRY-RUN] Summary:`);
        console.log(`   - Would publish ${statistics.successCount} entities`);
        console.log(`   - Would publish ${statistics.categoriesCount} categories`);
        console.log(`   - Would remove ${cleanup.removedCount} stale entities`);
        console.log(`   - Breakdown: ${statistics.byType.playlists} playlists, ${statistics.byType.albums} albums, ${statistics.byType['plex-media']} plex-media`);
        if (statistics.errorCount > 0) {
            console.log(`   - ${statistics.errorCount} items had errors`);
        }

        console.log(`\n✅ [DRY-RUN] No actual MQTT messages were published`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[DRY-RUN] Failed to write manifest: ${message}`);
    }
}
