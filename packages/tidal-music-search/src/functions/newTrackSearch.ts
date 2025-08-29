import { TidalMusicSearchApproach } from "../types/TidalMusicSearchApproach";
import { TidalMusicSearchTrack } from "../types/TidalMusicSearchTrack";
import { findTrack } from "./findTrack";

export type SearchResponse = {
    id: string;
    artist: string;
    title: string;
    album: string;
    result: any[];
};

export async function newTrackSearch(approaches: TidalMusicSearchApproach[], searchTrack: TidalMusicSearchTrack): Promise<SearchResponse> {
    const { id, artists, title, album } = searchTrack;

    for (let i = 0; i < artists.length; i++) {
        const artist = artists[i];
        if (!artist) continue;

        try {
            const result = await findTrack(approaches, { id, artist, title, album: album || "" });
            if (result && result.result.length > 0) {
                return result;
            }
        } catch (_e) {
            // Continue to next artist
        }
    }

    // When nothing is found
    return { id, artist: artists[0] || "", title, album: album || "", result: [] };
}