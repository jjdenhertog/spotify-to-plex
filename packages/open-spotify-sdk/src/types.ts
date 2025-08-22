
// API return types
export type MaxInt<T extends number> = number extends T ? number : _Range<T, []>;
type _Range<T extends number, R extends unknown[]> = R['length'] extends T ? R[number] | T : _Range<T, [R['length'], ...R]>;

export type AccessToken = {
    clientId: string
    accessToken: string
    accessTokenExpirationTimestampMs: number
    isAnonymous: boolean
}
export type ClientToken = {
    response_type: string
    granted_token: {
        token: string
        expires_after_seconds: number
        refresh_after_seconds: number,
        domains: { domain: string }[]
    }
}
type AlbumBase = {
    id: string
    images: Image[]
    name: string
    uri: string
}

export type SimplifiedAlbum = {
    artists: SimplifiedArtist[]
} & AlbumBase

export type Album = {
    artists: Artist[]
    tracks: Page<SimplifiedTrack>
} & AlbumBase

export type Albums = {
    albums: Album[]
}

export type Page<TItemType> = {
    items: TItemType[]
    limit: number
    offset: number
    total: number
}



export type SimplifiedTrack = {
    id: string
    artists: SimplifiedArtist[]
    discNumber: number
    trackNumber: number
    trackDuration: number
    name: string
    uri: string
}


export type Track = {
    album: SimplifiedAlbum
} & SimplifiedTrack

export type Tracks = {
    tracks: Track[]
}

type SimplifiedArtist = {
    name: string
    uri: string
}

export type Artist = {
    followers: Followers
    genres: string[]
    images: Image[]
    popularity: number
} & SimplifiedArtist

export type Artists = {
    artists: Artist[]
}

type Followers = {
    href: string | null
    total: number
}

export type TopTracksResult = {
    tracks: Track[];
}

export type Image = {
    url: string;
    height: number | null;
    width: number | null;
}

type PlaylistBase = {
    id: string
    description: string
    href: string
    images: Image[]
    name: string
    owner: UserReference
    uri: string
}

export type Playlist<Item extends Track = Track> = {
    tracks: Page<Item>
} & PlaylistBase

type UserReference = {
    avatar: {
        sources: { height: number; url: string; width: number }[];
    };
    name: string;
    uri: string;
    username: string;
}
