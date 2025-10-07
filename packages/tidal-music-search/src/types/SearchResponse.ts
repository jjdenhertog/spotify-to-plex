import { TidalTrack } from "./TidalTrack";

export type SearchResponse = {
    id: string;
    artist: string;
    title: string;
    album: string;
    albumId?: string;
    queries?: SearchQuery[]
    result: TidalTrack[];
};

export type SearchQuery = {
    approach: string
    artist: string
    title: string
    album: string,
    result?: TidalTrack[]
}