import { Track } from "../types/Track";
import { compareTitles } from '@spotify-to-plex/shared-utils/music/compareTitles';
import { removeFeaturing } from '@spotify-to-plex/shared-utils/music/removeFeaturing';
import { compareVersions } from "../utils/compareVersions";
import { getRuntimeFilters } from "./getRuntimeFilters";

export function search(find: Track, options: Track[], analyze: boolean = false) {
    const matchFilters = getRuntimeFilters();
    if (matchFilters.length == 0)
        throw new Error("No match filters found");

    const results: Track[] = options
        .map(item => {
            // Calculate duration similarity only if both have duration
            const hasBothDurations = !!(find.duration_ms && item.duration_ms);
            const durationSimilarity = hasBothDurations
                ? 1 - Math.abs(find.duration_ms! - item.duration_ms!) / Math.max(find.duration_ms!, item.duration_ms!)
                : 0;

            const matching = {
                album: compareTitles(item.album, find.album, true),
                title: compareTitles(item.title, find.title, true),
                artistInTitle: compareTitles(item.title, find.artist),
                artistWithTitle: compareTitles(item.title, `${find.artist} ${find.title}`, true),
                artist: compareTitles(item.artist, find.artist, true),
                alternativeArtist: compareTitles(removeFeaturing(item.artist), find.artist, true),
                version: compareVersions(item.title, find.title),
                duration: { similarity: durationSimilarity, available: hasBothDurations },
            };

            return {
                ...item,
                matching
            }
        })
        .sort((a, b) => {
            const aMatches = a.matching
                ? a.matching.artist.similarity + a.matching.title.similarity + a.matching.album.similarity + (a.matching.duration?.similarity ?? 0) * 0.5
                : 0;
            const bMatches = b.matching
                ? b.matching.artist.similarity + b.matching.title.similarity + b.matching.album.similarity + (b.matching.duration?.similarity ?? 0) * 0.5
                : 0;

            return bMatches - aMatches;
        })

    if (analyze) {
        return results
            .map(item => {

                const isMatchingApproach = matchFilters.some(filter => filter.filter(item));
                if (!item.matching)
                    return null;

                return {
                    ...item,
                    matching: {
                        ...item.matching,
                        isMatchingApproach
                    }
                }
            })
            .filter((item) => !!item)
            .slice(0, 10);
    }

    for (let i = 0; i < matchFilters.length; i++) {
        const matchFilter = matchFilters[i];
        if (!matchFilter)
            continue;

        const { reason, filter } = matchFilter;
        const result = results.filter(filter)

        if (result.length > 0) {
            const tracks: Track[] = result.map(item => ({
                id: item.id,
                title: item.title,
                artist: item.artist,
                album: item.album,
                duration_ms: item.duration_ms,
                matching: analyze ? item.matching : undefined,
                reason: analyze ? reason : undefined
            }))

            return tracks;
        }
    }

    return []
}