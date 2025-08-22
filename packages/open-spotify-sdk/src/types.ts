
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
interface AlbumBase {
    id: string
    images: Image[]
    name: string
    uri: string
}

export interface SimplifiedAlbum extends AlbumBase {
    artists: SimplifiedArtist[]
}

export interface Album extends AlbumBase {
    artists: Artist[]
    tracks: Page<SimplifiedTrack>
}

export interface Albums {
    albums: Album[]
}

export interface Page<TItemType> {
    items: TItemType[]
    limit: number
    offset: number
    total: number
}



export interface SimplifiedTrack {
    id: string
    artists: SimplifiedArtist[]
    discNumber: number
    trackNumber: number
    trackDuration: number
    name: string
    uri: string
}


export interface Track extends SimplifiedTrack {
    album: SimplifiedAlbum
}

export interface Tracks {
    tracks: Track[]
}

interface SimplifiedArtist {
    name: string
    uri: string
}

export interface Artist extends SimplifiedArtist {
    followers: Followers
    genres: string[]
    images: Image[]
    popularity: number
}

export interface Artists {
    artists: Artist[]
}

interface Followers {
    href: string | null
    total: number
}

export interface TopTracksResult {
    tracks: Track[];
}

export interface Image {
    url: string;
    height: number | null;
    width: number | null;
}

interface PlaylistBase {
    id: string
    description: string
    href: string
    images: Image[]
    name: string
    owner: UserReference
    uri: string
}

export interface Playlist<Item extends Track = Track> extends PlaylistBase {
    tracks: Page<Item>
}

interface UserReference {
    avatar: {
        sources: { height: number; url: string; width: number }[];
    };
    name: string;
    uri: string;
    username: string;
}
