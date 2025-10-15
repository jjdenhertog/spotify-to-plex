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
