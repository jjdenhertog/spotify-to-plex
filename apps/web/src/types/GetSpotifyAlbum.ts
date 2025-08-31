import { Track } from './Track';

export type GetSpotifyAlbum = {
    type: "spotify-album";
    id: string;
    title: string;
    private?: boolean;
    added?: boolean
    user_title?: string
    image: string;
    tracks: Track[];
};