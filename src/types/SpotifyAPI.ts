export type GetSpotifyPlaylist = {
    type: "spotify-playlist";
    id: string;
    name: string;
    image: string;
    owner:string;
    tracks: {
        id: string;
        name: string;
        artist: string;
        album: string;
        artists: string[];
    }[];
};
export type GetSpotifyAlbum = {
    type: "spotify-album";
    id: string;
    name: string;
    artists: string[];
    image: string;
    tracks: {
        id: string;
        artist: string;
        name: string;
    }[];
};
