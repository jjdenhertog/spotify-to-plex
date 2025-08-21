import { Playlist } from "./Playlist";

export type GetPlaylistResponse = {
    MediaContainer: {
        size: number;
        Metadata: Playlist[];
    };
};
