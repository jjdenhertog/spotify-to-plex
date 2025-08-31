import { SpotifyAlbum } from "./SpotifyAlbum";
import { SpotifyArtist } from "./SpotifyArtist";

export type SpotifyScraperTrack = {
    album: SpotifyAlbum;
    artists: SpotifyArtist[];
    duration: number;
    duration_ms: number;
    id: string;
    is_explicit: boolean;
    is_playable: boolean;
    name: string;
    preview_url: string;
    release_date: string;
    title: string;
    type: string;
    uri: string;
};