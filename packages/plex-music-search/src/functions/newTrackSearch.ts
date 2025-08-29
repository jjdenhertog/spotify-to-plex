import { PlexMusicSearchApproach } from "../types/PlexMusicSearchApproach";
import { PlexMusicSearchTrack } from "../types/PlexMusicSearchTrack";
import { SearchQuery, SearchResponse } from "../types/SearchResponse";
import { findTrack } from "./findTrack";

export async function newTrackSearch(approaches: PlexMusicSearchApproach[], searchTrack: PlexMusicSearchTrack, includeMatching: boolean): Promise<SearchResponse> {
    const { id, artists, title, album } = searchTrack;

    let queries: SearchQuery[] = [];

    for (let j = 0; j < artists.length; j++) {
        const artist = artists[j];
        try {
            const result = await findTrack(approaches, { id, artist: artist || '', title, album: album || '' }, includeMatching);
            queries = queries.concat(result.queries);

            if (result && result.result.length > 0) {
                return result;
            }
        } catch (_e) {
            // Continue to next artist
        }
    }

    return { id, artist: artists[0] || '', title, album: album || "", queries, result: [] };
}