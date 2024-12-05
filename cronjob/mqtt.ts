import { useMQTT } from '@/helpers/mqtt/useMQTT';
import { configDir } from '@/library/configDir';
import { plex } from '@/library/plex';
import { MQTTItem } from '@/types/dashboard/DashboardItem';
import { PlaylistData } from '@/types/dashboard/PlaylistData';
import { SavedItem } from '@/types/SpotifyAPI';
import { TrackLink } from '@/types/TrackLink';
import { PlexMusicSearch } from '@jjdenhertog/plex-music-search';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function createDashboard() {
    const mqtt = useMQTT()

    const savedItemsPath = join(configDir, 'spotify_saved_items.json')
    if (!existsSync(savedItemsPath))
        throw new Error('Missing spotify saved items')

    const playlistPath = join(configDir, 'playlists.json')
    if (!existsSync(playlistPath))
        throw new Error('Missing playlists')

    const trackLinksPath = join(configDir, 'track_links.json')
    if (!existsSync(trackLinksPath))
        throw new Error('Track links missing')

    if (!plex.settings.token || !plex.settings.uri)
        throw new Error('Missing plex')

    const savedItems: SavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'))
    const playlists: PlaylistData = JSON.parse(readFileSync(playlistPath, 'utf8'))
    const trackLinks: TrackLink[] = JSON.parse(readFileSync(trackLinksPath, 'utf8'))

    const categories: string[] = []
    const items: MQTTItem[] = []

    for (let i = 0; i < savedItems.length; i++) {
        const savedItem = savedItems[i];

        const { type, id, title, label } = savedItem;
        if (!label)
            return;

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
                const mediaContentId = id
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
                    return;

                item = { id: entityId, category: label, name: title, media_content_id: trackLink.plex_id[0] }

                break;
            case "spotify-playlist":
                // Skip if theres not track link
                const playlist = playlists.data.find(item => item.id == id)
                if (!playlist?.plex)
                    return;

                item = { id: entityId, category: label, name: title, media_content_id: `/library/metadata/${playlist.plex}` }
                break;
        }

        if (!item)
            continue;

        try {
            const mediaContentId = item.media_content_id;
            const data = await plexMusicSearch.getById(mediaContentId)
            if (data) {
                const { guid, image } = data;
                const type = guid.includes('album') ? 'album' : 'playlist'

                // Publish MQTT
                const mqttItem: MQTTItem = {
                    ...item,
                    type,
                    thumb: image || ""
                }

                items.push(mqttItem)
                mqtt.publishItem(mqttItem)

            } else {
                console.log(`Data could not be loaded: ${item.name}`)
            }

        } catch (_e) {
            console.log(_e)
            console.log(`Uncaught error: ${item.name}`)
        }
    }

    // Update categories
    mqtt.publishCategories(categories)
    mqtt.removeUnusedItems(items)
}


function run() {
    createDashboard()
        .then(() => {
            console.log(`Create dashboard completed`)
        })
        .catch((e: unknown) => {
            console.log(e)
        })
}

run();