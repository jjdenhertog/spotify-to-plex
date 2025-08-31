import { Track } from './Track';

export type GetSpotifyPlaylist = {
    type: "spotify-playlist";
    id: string;
    added?: boolean
    private?: boolean
    user_id?: string
    title: string;
    user_title?: string
    image: string;
    owner: string;
    tracks: Track[];
};