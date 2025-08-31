export type SavedItem = {
    type: "spotify-album" | "spotify-playlist" | "plex-media"
    uri: string
    id: string
    title: string
    image: string

    // @Todo: Private user syncing
    user?: string;

    label?: string
    sync?: boolean
    sync_interval?: string
}