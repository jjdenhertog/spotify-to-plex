import { Playlist } from '@spotify-to-plex/shared-types/plex/Playlist';

export type GetPlaylistResponse = {
    MediaContainer: {
        size: number
        Metadata: Playlist[]
    }
}