export type GetSpotifyPlaylist = {
    type: "spotify-playlist";
    id: string;
    added?: boolean
    private?: boolean
    user_id?: string
    title: string;
    user_title?: string
    image: string;
    owner: string;
    tracks: Track[];
};

export type Track = {
    id: string;
    title: string;
    album: string;
    artists: string[];
}
export type Album = {
    id: string;
    title: string;
}

export type GetSpotifyAlbum = {
    type: "spotify-album";
    id: string;
    title: string;
    private?: boolean;
    added?: boolean
    user_title?: string
    image: string;
    tracks: Track[];
};

export type SpotifyCredentials = {

    user: SpotifyUser
    access_token: {
        access_token: string,
        refresh_token: string,
        expires_in: number,
        token_type: string
    },
    expires_at: number
}

export type SpotifyUser = {
    id: string,
    name: string,
    sync?: boolean
    label?: string
    daylistMorning?: boolean
    daylistAfternoon?: boolean
    daylistEvening?: boolean
    recentSongs?: boolean
}

export type RecentPlayedContext = {
    type: string,
    href: string,
    uri: string
}
export type SpotifySavedItem = {
    type: "spotify-album" | "spotify-playlist"
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