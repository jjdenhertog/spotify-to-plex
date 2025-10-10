export type LidarrAlbumData = {
    artist_name: string;
    album_name: string;
    spotify_album_id?: string;
};

export type LidarrSearchResult = {
    album?: {
        id: string;
        title: string;
        foreignAlbumId: string;
        disambiguation: string;
        overview: string;
        artistId: number;
        images?: Array<{
            url: string;
            coverType: string;
        }>;
        artist?: {
            artistName: string;
            foreignArtistId: string;
        };
    };
};

export type LidarrAddAlbumRequest = {
    foreignAlbumId: string;
    title: string;
    artistId: number;
    profileId: number;
    qualityProfileId: number;
    metadataProfileId: number;
    monitored: boolean;
    anyReleaseOk: boolean;
    rootFolderPath: string;
    addOptions: {
        searchForNewAlbum: boolean;
    };
    artist: {
        foreignArtistId: string;
        artistName: string;
        qualityProfileId: number;
        metadataProfileId: number;
        rootFolderPath: string;
    };
};

export type LidarrSyncLog = {
    id: string;
    artist_name: string;
    album_name: string;
    start: number;
    end?: number;
    status: 'success' | 'error' | 'not_found';
    error?: string;
    musicbrainz_album_id?: string;
    musicbrainz_artist_id?: string;
};
