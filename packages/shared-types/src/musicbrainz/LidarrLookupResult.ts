export type LidarrLookupResult = {
    title: string;
    disambiguation: string;
    foreignAlbumId: string;
    monitored: boolean;
    anyReleaseOk: boolean;
    profileId: number;
    duration: number;
    albumType: string;
    secondaryTypes: string[];
    mediumCount: number;
    ratings: {
        votes: number;
        value: number;
    };
    releaseDate: string;
    releases: {
        id: number;
        albumId: number;
        foreignReleaseId: string;
        title: string;
        status: string;
        duration: number;
        trackCount: number;
        media: {
            mediumNumber: number;
            mediumName: string;
            mediumFormat: string;
        }[];
        mediumCount: number;
        country: string[];
        label: string[];
        format: string;
        monitored: boolean;
    }[];
    genres: string[];
    media: {
        mediumNumber: number;
        mediumName: string;
        mediumFormat: string;
    }[];
    artist: {
        status: string;
        ended: boolean;
        artistName: string;
        foreignArtistId: string;
        tadbId: number;
        discogsId: number;
        artistType: string;
        disambiguation: string;
        links: {
            url: string;
            name: string;
        }[];
        images: any[];
        qualityProfileId: number;
        metadataProfileId: number;
        monitored: boolean;
        monitorNewItems: string;
        genres: string[];
        tags: string[];
        added: string;
        ratings: {
            votes: number;
            value: number;
        };
    };
    images: {
        url: string;
        coverType: string;
        extension: string;
        remoteUrl: string;
    }[];
    links: any[];
    remoteCover: string;
};
