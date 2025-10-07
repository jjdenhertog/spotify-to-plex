import { Track } from "@spotify-to-plex/music-search/types/Track";

export type PlexTrack = {
    guid: string;
    id: string;
    source?: string;
    artist: {
        id: string;
        title: string;
        guid?: string;
        image?: string;
    };
    album?: {
        id: string;
        title: string;
        guid?: string;
        image?: string;
    };
    title: string;
    image: string;
    src: string;

    matching?: Track["matching"]
}