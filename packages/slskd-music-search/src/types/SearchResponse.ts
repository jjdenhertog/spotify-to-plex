import { SearchQuery } from './SearchQuery';
import type { SlskdTrack } from "./SlskdTrack";


export type SearchResponse = {
    id: string;
    artist: string;
    title: string;
    album: string;
    albumId?: string;
    queries?: SearchQuery[];
    result: SlskdTrack[];
};
