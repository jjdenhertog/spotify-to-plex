import { settingsDir } from '@/library/settingsDir';
import { plex } from '@/library/plex';
import { MQTTItem } from '@/types/dashboard/MQTTItem';
import { PlaylistData } from '@/types/dashboard/PlaylistData';
import { TrackLink } from '@/types/TrackLink';
import { PlexMusicSearch } from '@spotify-to-plex/plex-music-search';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mqttHelpers } from './helpers/mqttHelpers';
import { savedItemsHelpers } from './helpers/savedItemsHelpers';

export async function refreshMQTT() {
    const mqtt = mqttHelpers()
    await mqtt.open()

    const { items: savedItems } = savedItemsHelpers()
    if (savedItems.length == 0)
        throw new Error('Missing spotify saved items')

    const playlistPath = join(settingsDir, 'playlists.json')
    if (!existsSync(playlistPath))
        throw new Error('Missing playlists')

    const trackLinksPath = join(settingsDir, 'track_links.json')
    if (!existsSync(trackLinksPath))
        throw new Error('Track links missing')

    if (!plex.settings.token || !plex.settings.uri)
        throw new Error('Missing plex')

    const playlists: PlaylistData = JSON.parse(readFileSync(playlistPath, 'utf8'))
    const trackLinks: TrackLink[] = JSON.parse(readFileSync(trackLinksPath, 'utf8'))

    const categories: string[] = []
    const items: MQTTItem[] = []

    for (let i = 0; i < savedItems.length; i++) {
        const savedItem = savedItems[i];

        const { type, id, title, label, uri } = savedItem;
        if (!label)
            continue;

        if (!categories.includes(label))
            categories.push(label)

        const entityId = id.slice(Math.max(0, id.lastIndexOf("/") + 1))
        const plexMusicSearch = new PlexMusicSearch({
            uri: plex.settings.uri,
            token: plex.settings.token,
        })

        let item: { id: string, category: string, name: string, media_content_id: string } | null = null;

        switch (type) {
            case "plex-media":
                const mediaContentId = uri
                    .split("/playlist")
                    .join("")
                    .split("/children")
                    .join("")
                    .split("/items")
                    .join("")

                item = { id: entityId, category: label, name: title, media_content_id: mediaContentId }

                break;
            case "spotify-album":
                // Skip if theres not track link
                const trackLink = trackLinks.find(item => item.spotify_id == id)
                if (!trackLink?.plex_id || trackLink.plex_id.length == 0)
                    continue;

                item = { id: entityId, category: label, name: title, media_content_id: trackLink.plex_id[0] }

                break;
            case "spotify-playlist":
                // Skip if theres not track link
                const playlist = playlists.data.find(item => item.id == id)
                if (!playlist?.plex)
                    continue;

                item = { id: entityId, category: label, name: title, media_content_id: `/library/metadata/${playlist.plex}` }
                break;
        }

        if (!item)
            continue;

        try {
            const mediaContentId = item.media_content_id;
            const data = await plexMusicSearch.getById(mediaContentId)
            if (data) {
                const { image } = data;

                // Publish MQTT
                const mqttItem: MQTTItem = {
                    ...item,
                    thumb: image || ""
                }

                items.push(mqttItem)
                await mqtt.publishItem(mqttItem)
            }

        } catch (_e) {
        }
    }

    // Update categories
    await mqtt.publishCategories(categories)
    await mqtt.removeUnusedItems(items)

    await mqtt.close()
}


function run() {
    if (typeof process.env.MQTT_BROKER_URL != 'string' || typeof process.env.MQTT_USERNAME != 'string' || typeof process.env.MQTT_PASSWORD != 'string')
        return;

    console.log(`-- Publishing MQTT Items, for use with Home Assistant --`)
    refreshMQTT()
        .then(() => {
            console.log(`Publish MQTT items completed`)
        })
        .catch((_e: unknown) => {
            // Do nothing
        })
}

run();