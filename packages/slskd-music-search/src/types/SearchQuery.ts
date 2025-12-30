import type { SlskdTrack } from "./SlskdTrack";


export type SearchQuery = {
    approach: string;
    artist: string;
    title: string;
    album: string;
    result?: SlskdTrack[];
};
