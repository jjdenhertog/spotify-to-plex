import { SpotifyImage } from "./SpotifyImage";

export type SpotifyAlbum = {
    images: SpotifyImage[];
    name: string;
    type: string;
};