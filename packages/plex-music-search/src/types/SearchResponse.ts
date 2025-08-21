import { PlexTrack } from "./PlexTrack";

export type SearchResponse = {
    id: string;
    artist: string;
    title: string;
    album: string;
    queries?: SearchQuery[]
    result: PlexTrack[];
};

export type SearchQuery = {
    approach: string
    artist: string
    title: string
    album: string
}