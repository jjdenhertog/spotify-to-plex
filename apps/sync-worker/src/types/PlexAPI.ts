export type DiscoveryMetadata = {
    type: Metadata["type"],
    addedAt: number,
    duration: number,
    grandparentTitle: string,
    guid: string,
    key: string,
    originallyAvailableAt: string,
    parentKey: string,
    parentTitle: string,
    ratingKey: string,
    thumb: string,
    title: string,
    year: number,
    source: string,
}

export type DiscoverySearchResult = {
    Metadata: DiscoveryMetadata,
    score: number
}
export type DiscoverySearchResultGroup = {
    id: string,
    title: string,
    size: number,
    SearchResult?: DiscoverySearchResult[]
}
export type DiscoverySearchResponse = {
    MediaContainer: {
        size: number
        SearchResults: DiscoverySearchResultGroup[],
    }
}
export type MediaPart = {
    id: number,
    key: string,
    duration: number,
    file: string,
    size: number,
    container: string,
    hasThumbnail: '1' | '0'
}

export type Media = {
    id: number,
    duration: number,
    bitrate: number,
    audioChannels: number,
    audioCodec: string,
    container: string,
    Part: MediaPart[]
}

export type Metadata = {
    librarySectionTitle: string,
    score: string,
    ratingKey: string,
    year: string
    key: string,
    parentRatingKey: string,
    grandparentRatingKey: string,
    guid: string,
    originalTitle?:string
    parentGuid: string,
    grandparentGuid: string,
    parentStudio: string,
    type: string,
    title: string,
    grandparentKey: string,
    parentKey: string,
    librarySectionID: 1,
    librarySectionKey: string,
    grandparentTitle: string,
    parentTitle: string,
    summary: string,
    index: number,
    parentIndex: number,
    ratingCount: number,
    parentYear: number,
    thumb: string,
    art: string,
    parentThumb: string,
    grandparentThumb: string,
    grandparentArt: string,
    duration: number,
    addedAt: number,
    updatedAt: number,
    musicAnalysisVersion: string,
    Media: Media[]
}

export type Hub = {
    title: "Tracks" | "Shows" | "Artists" | "Albums" | "Episodes" | "Movies" | "Photo" | "Automatic" | "Photos" | "Tags" | "Actors" | "Directors" | "Genres" | "Collections" | "Playlists" | "Shared" | "Places",
    type: "track" | "show" | "artist" | "album" | "episode" | "movie" | "photoalbum" | "autotag" | "photo" | "tag" | "actor" | "director" | "genre" | "collection" | "playlist" | "shared" | "place",
    hubIdentifier: "track" | "show" | "artist" | "album" | "episode" | "movie" | "photoalbum" | "autotag" | "photo" | "tag" | "actor" | "director" | "genre" | "collection" | "playlist" | "shared" | "place",
    context: string,
    size: number,
    more: boolean,
    style: string,
    Metadata: Metadata[]
}
export type HubSearchResponse = {
    MediaContainer: {
        size: number
        Hub: Hub[],
    }
}
export type PostPinResponse = {
    id: number,
    code: string,
    product: string,
    trusted: boolean,
    qr: string,
    clientIdentifier: string,
    location: {
        code: string,
        european_union_member: boolean,
        continent_code: string,
        country: string,
        city: string,
        time_zone: string,
        postal_code: string,
        in_privacy_restricted_country: boolean,
        subdivisions: string,
        coordinates: string,
    },
    expiresIn: number,
    createdAt: string,
    expiresAt: string,
    authToken: string,
    newRegistration: string
}

export type GetPlexPinResponse = {
    id: number,
    code: string,
    product: string,
    trusted: boolean,
    qr: string,
    clientIdentifier: string,
    location: {
        code: string,
        european_union_member: boolean,
        continent_code: string,
        country: string,
        city: string,
        time_zone: string,
        postal_code: string,
        in_privacy_restricted_country: boolean,
        subdivisions: string,
        coordinates: string,
    },
    expiresIn: number,
    createdAt: string,
    expiresAt: string,
    authToken: string,
    newRegistration: boolean
}

export type GetUserResponse = {
    id: number,
    uuid: string,
    username: string,
    title: string,
    email: string,
    friendlyName: string,
    locale: null,
    confirmed: boolean,
    joinedAt: number,
    emailOnlyAuth: boolean,
    hasPassword: boolean,
    protected: boolean,
    thumb: string,
    authToken: string,
    mailingListStatus: string,
    mailingListActive: boolean,
    scrobbleTypes: string,
    country: string,
    subscription: {
        active: boolean,
        subscribedAt: string,
        status: string,
        paymentService: string,
        plan: string,
        features: string[]
    },
    subscriptionDescription: string,
    restricted: boolean,
    anonymous: boolean,
    home: boolean,
    guest: boolean,
    homeSize: number,
    homeAdmin: boolean,
    maxHomeSize: number,
    rememberExpiresAt: number,
    profile: {
        autoSelectAudio: boolean,
        defaultAudioLanguage: string,
        defaultSubtitleLanguage: string,
        autoSelectSubtitle: number,
        defaultSubtitleAccessibility: number,
        defaultSubtitleForced: number
    },
    entitlements: string[],
    roles: string[]
    services: {
        identifier: string,
        endpoint: string,
        token: string,
        secret: null,
        status: string,
    }[]
    adsConsent: null,
    adsConsentSetAt: null,
    adsConsentReminderAt: null,
    experimentalFeatures: boolean,
    twoFactorEnabled: boolean,
    backupCodesCreated: boolean
}

export type GetPlaylistResponse = {
    MediaContainer: {
        size: number
        Metadata: Playlist[]
    }
}
export type Playlist = {
    ratingKey: string //'2',
    key: string //'/playlists/2/items',
    guid: string //'com.plexapp.agents.none://9f7bb838-4c57-47fb-9acf-368ba5c1d615',
    type: string //'playlist',
    title: string //'❤️ Tracks',
    titleSort: string //'️ Tracks',
    summary: string //'All your highly rated tracks, in one convenient place.',
    smart: true
    playlistType: string //'audio',
    composite: string //'/playlists/2/composite/1707120272',
    icon: string //'playlist://image.smart',
    viewCount: number //1,
    lastViewedAt: number //1703687518,
    duration: number //198000,
    leafCount: number //1,
    addedAt: number //1703687518,
    updatedAt: number //1707120272
}