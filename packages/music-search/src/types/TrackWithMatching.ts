import { Track } from "./Track";

export type TrackWithMatching = Track & {
    matching: {
        album: { match: boolean; contains: boolean; similarity: number; };
        title: { match: boolean; contains: boolean; similarity: number; };
        artist: { match: boolean; contains: boolean; similarity: number; };
        artistInTitle: { match: boolean; contains: boolean; similarity: number; };
        artistWithTitle: { match: boolean; contains: boolean; similarity: number; };
    };
};
