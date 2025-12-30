import { search as musicSearch } from "@spotify-to-plex/music-search/functions/search";
import { filterOutWords } from "@spotify-to-plex/music-search/utils/filterOutWords";
import type { Track } from "@spotify-to-plex/music-search/types/Track";
import type { SlskdMusicSearchApproach } from "../types/SlskdMusicSearchApproach";
import type { SlskdMusicSearchTrack } from "../types/SlskdMusicSearchTrack";
import type { SearchQuery } from '../types/SearchQuery';
import type { SlskdTrack } from "../types/SlskdTrack";
import { searchForTrack } from "../utils/searchForTrack";
import { slskdResultToTracks } from "../utils/slskdResultToTracks";
import { getConfig } from "../session/state";

////////////////////////////////////////////
// Constants
////////////////////////////////////////////

const FORMAT_PRIORITY: Record<string, number> = {
    'flac': 1,
    'wav': 2,
    'alac': 3,
    'aiff': 4,
    'ape': 5,
    'wv': 6,
    'mp3': 10,
    'aac': 11,
    'm4a': 12,
    'ogg': 13,
    'opus': 14,
    'wma': 15,
};


////////////////////////////////////////////
// Functions
////////////////////////////////////////////
export async function newTrackSearch(approaches: SlskdMusicSearchApproach[], searchTrack: SlskdMusicSearchTrack, analyze: boolean = false) {
    const { id, artists, title, album = '' } = searchTrack;

    const executedQueries = new Set<string>();

    const artistVariations = [...artists];
    if (artists.length > 1)
        artistVariations.push(artists.join(", "));

    const allQueries: SearchQuery[] = [];
    let finalResult: SlskdTrack[] = [];

    for (const approach of approaches) {
        if (finalResult.length > 0 && !analyze)
            break;

        for (const artist of artistVariations) {
            if (!artist)
                continue;

            const searchResult = await tryApproachWithArtist(
                approach,
                { id, artist, title, album },
                analyze,
                executedQueries
            );

            if (!searchResult || searchResult.skipped)
                continue;

            allQueries.push(...searchResult.queries);

            if (searchResult.result.length === 0)
                continue;

            finalResult = searchResult.result;

            if (!analyze)
                break;
        }
    }

    return {
        id,
        artist: artists[0] || '',
        title,
        album: album || '',
        queries: allQueries,
        result: finalResult
    };
}


function getFormatPriority(extension: string) {
    const ext = extension.toLowerCase().replace(/^\./, '');

    return FORMAT_PRIORITY[ext] ?? 100;
}

function sortByFormatPreference<T extends { extension: string }>(tracks: T[]) {
    return [...tracks].sort((a, b) => {
        return getFormatPriority(a.extension) - getFormatPriority(b.extension);
    });
}

async function tryApproachWithArtist(approach: SlskdMusicSearchApproach, searchParams: SearchParams, analyze: boolean, executedQueries: Set<string>) {
    try {
        return await performApproachSearch(approach, searchParams, analyze, executedQueries);
    } catch (e) {
        console.error(`[newTrackSearch] Error in approach ${approach.id}:`, e instanceof Error ? e.message : e);

        return null;
    }
}

async function performApproachSearch(approach: SlskdMusicSearchApproach, searchParams: SearchParams, analyze: boolean, executedQueries: Set<string>) {
    const { id, artist, title, album } = searchParams;
    const config = getConfig();

    if (!config)
        throw new Error("Configuration not set. Call setMusicSearchConfig first.");

    if (!config.textProcessing)
        throw new Error("textProcessing not set in config");

    const queries: SearchQuery[] = [];
    let searchResult: SlskdTrack[] = [];

    const { id: approachId, trim, filtered, ignoreQuotes: removeQuotes } = approach;

    const searchArtist = filterOutWords(artist.toLowerCase(), config.textProcessing, filtered, trim, removeQuotes);
    const searchAlbum = filterOutWords(album.toLowerCase(), config.textProcessing, filtered, trim, removeQuotes);
    const searchTrack = filterOutWords(title.toLowerCase(), config.textProcessing, filtered, trim, removeQuotes);

    const querySignature = `${searchArtist}|${searchTrack}|${searchAlbum}`.toLowerCase();

    if (executedQueries.has(querySignature)) {
        console.log(`[performSearch] Skipping duplicate query for approach ${approachId}: "${searchArtist} ${searchTrack}"`);

        return { queries: [], result: [], skipped: true };
    }

    executedQueries.add(querySignature);

    const performSearch = async (approach: string, artist: string, title: string, album: string) => {
        const searchResults = await searchForTrack(artist, title, album);
        const convertedTracks = slskdResultToTracks(searchResults);
        const musicSearchResult = musicSearch({ id, artist, title, album }, convertedTracks, analyze);

        const slskdTracks = musicSearchResult
            .map((item: Track) => {
                const searchResult = searchResults.find(track => track.filename === item.id);
                if (!searchResult)
                    return null;

                return { ...searchResult, matching: item.matching };
            })
            .filter((item) => !!item);

        const sortedTracks = sortByFormatPreference(slskdTracks);
        const query: SearchQuery = { approach, artist, title, album };
        if (analyze)
            query.result = sortedTracks;

        queries.push(query);

        return sortedTracks;
    };

    searchResult = await performSearch(approachId, searchArtist, searchTrack, searchAlbum);

    if (searchResult.length == 0 && (searchArtist.indexOf("&") > -1 || searchTrack.indexOf("&") > -1)) {
        const altSearchArtist = searchArtist.split('&').join('and');
        const altSearchTrack = searchTrack.split('&').join('and');
        searchResult = await performSearch(approachId, altSearchArtist, altSearchTrack, searchAlbum);
    }

    return { queries, result: searchResult, skipped: false };
}


////////////////////////////////////////////
// Types
////////////////////////////////////////////
type SearchParams = { id: string; artist: string; title: string; album: string };