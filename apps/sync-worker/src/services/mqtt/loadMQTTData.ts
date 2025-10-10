import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { SavedItem } from '@spotify-to-plex/shared-types/spotify/SavedItem';
import { PlaylistData } from '@spotify-to-plex/shared-types/dashboard/PlaylistData';
import { LoadedData, TrackLink } from './types';

/**
 * Load spotify_saved_items.json
 */
function loadSavedItems(): SavedItem[] {
    const storageDir = getStorageDir();
    const filePath = join(storageDir, 'spotify_saved_items.json');

    if (!existsSync(filePath)) {
        throw new Error(`Required file not found: ${filePath}`);
    }

    try {
        const content = readFileSync(filePath, 'utf8');
        const items = JSON.parse(content) as SavedItem[];

        // Filter items that have a label/category
        return items.filter(item => item.label && item.label.trim() !== '');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to load saved items: ${message}`);
    }
}

/**
 * Load playlists.json
 */
function loadPlaylists(): PlaylistData {
    const storageDir = getStorageDir();
    const filePath = join(storageDir, 'playlists.json');

    if (!existsSync(filePath)) {
        console.warn('[MQTT] playlists.json not found, returning empty data');

        return { data: [] };
    }

    try {
        const content = readFileSync(filePath, 'utf8');

        return JSON.parse(content) as PlaylistData;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[MQTT] Failed to load playlists.json: ${message}`);

        return { data: [] };
    }
}

/**
 * Load track_links.json
 */
function loadTrackLinks(): TrackLink[] {
    const storageDir = getStorageDir();
    const filePath = join(storageDir, 'track_links.json');

    if (!existsSync(filePath)) {
        console.warn('[MQTT] track_links.json not found, returning empty array');

        return [];
    }

    try {
        const content = readFileSync(filePath, 'utf8');

        return JSON.parse(content) as TrackLink[];
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[MQTT] Failed to load track_links.json: ${message}`);

        return [];
    }
}

/**
 * Load all required data files
 */
export function loadMQTTData(): LoadedData {
    const savedItems = loadSavedItems();
    const playlists = loadPlaylists();
    const trackLinks = loadTrackLinks();

    return {
        savedItems,
        playlists,
        trackLinks,
    };
}
