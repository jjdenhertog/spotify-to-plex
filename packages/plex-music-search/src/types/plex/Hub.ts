import { Metadata } from "./Metadata";


export type Hub = {
    title: "Tracks" | "Shows" | "Artists" | "Albums" | "Episodes" | "Movies" | "Photo" | "Automatic" | "Photos" | "Tags" | "Actors" | "Directors" | "Genres" | "Collections" | "Playlists" | "Shared" | "Places";
    type: "track" | "show" | "artist" | "album" | "episode" | "movie" | "photoalbum" | "autotag" | "photo" | "tag" | "actor" | "director" | "genre" | "collection" | "playlist" | "shared" | "place";
    hubIdentifier: "track" | "show" | "artist" | "album" | "episode" | "movie" | "photoalbum" | "autotag" | "photo" | "tag" | "actor" | "director" | "genre" | "collection" | "playlist" | "shared" | "place";
    context: string;
    size: number;
    more: boolean;
    style: string;
    Metadata: Metadata[];
};
