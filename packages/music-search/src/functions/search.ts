import { Track } from "../types/Track";
import { TrackWithMatching } from "../types/TrackWithMatching";
import { compareTitles } from "../utils/compareTitles";
import { removeFeaturing } from "../utils/removeFeaturing";
import { getRuntimeFilters } from "./getRuntimeFilters";

export function search(find: Track, options: Track[], includeMatching: boolean = false): Track[] {
    const matchFilters = getRuntimeFilters();

    const results: TrackWithMatching[] = options
        .map(item => {
            return {
                ...item,
                matching: {
                    album: compareTitles(item.album, find.album, true),
                    title: compareTitles(item.title, find.title, true),
                    artistInTitle: compareTitles(item.title, find.artist),
                    artistWithTitle: compareTitles(item.title, `${find.artist} ${find.title}`, true),
                    artist: compareTitles(item.artist, find.artist, true),
                    alternativeArtist: compareTitles(removeFeaturing(item.artist), find.artist, true),
                }
            }
        })
        .sort((a, b) => {
            const aMatches = a.matching ? a.matching.artist.similarity + a.matching.title.similarity : 0;
            const bMatches = b.matching ? b.matching.artist.similarity + b.matching.title.similarity : 0;

            return bMatches - aMatches;
        })

    for (let i = 0; i < matchFilters.length; i++) {
        const matchFilter = matchFilters[i];
        if (!matchFilter) continue;

        const { reason, filter } = matchFilter;
        const result = results.filter(filter)
        if (result.length > 0) {
            const tracks: Track[] = result.map(item => ({
                id: item.id,
                title: item.title,
                artist: item.artist,
                album: item.album,
                matching: includeMatching ? item.matching : undefined,
                reason: includeMatching ? reason : undefined
            }))

            return tracks;
        }
    }

    return []
}