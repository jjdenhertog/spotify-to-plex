export type LidarrSearchResult = {
    album?: {
        id: string;
        title: string;
        foreignAlbumId: string;
        disambiguation: string;
        overview: string;
        artistId: number;
        images?: {
            url: string;
            coverType: string;
        }[];
        artist?: {
            artistName: string;
            foreignArtistId: string;
        };
    };
};
