import { Track } from "@spotify-to-plex/music-search/types/Track";

export type TidalTrack = {
    id: string;
    title: string;
    link: string;
    artists: {
        name: string;
        link: string;
    }[];
    artist: {
        title: string;
    };
    album: {
        id: string;
        title: string;
        link: string;
    };
    matching?: Track["matching"]
};
