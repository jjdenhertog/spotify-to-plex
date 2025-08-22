/* eslint-disable @typescript-eslint/no-empty-function */
import { SearchConfig } from "./types/SearchConfig";
import { Track } from "./types/Track";
import { TrackWithMatching } from "./types/TrackWithMatching";
import { compareTitles } from "./utils/compareTitles";
import { removeFeaturing } from "./utils/removeFeaturing";

export default class MusicSearch {

    private _config?: SearchConfig

    private constructor() { }

    private static _instance: MusicSearch
    public static getInstance() {
        if (this._instance)
            return this._instance;

        this._instance = new MusicSearch()

        return this._instance;
    }

    public set config(config: SearchConfig) {
        this._config = config;
    }

    public get config() {
        return this._config ?? {}
    }

    public search(find: Track, options: Track[], includeMatching: boolean = false): Track[] {

        const {
            matchFilters = [
                // Full artist matches
                { reason: 'Full match on Artist & Title', filter: (item: TrackWithMatching) => item.matching.artist.match && item.matching.title.match },
                { reason: 'Artsit matches and Title contains', filter: (item: TrackWithMatching) => item.matching.artist.match && item.matching.title.contains },
                { reason: 'Artist matches and Title has 80% similarity', filter: (item: TrackWithMatching) => item.matching.artist.match && item.matching.title.similarity >= .8 },
                // Artist contains (so no full match)
                { reason: 'Artsit contains and Title matches', filter: (item: TrackWithMatching) => item.matching.artist.contains && item.matching.title.match },
                { reason: 'Artist contains and Title has 85% similarity', filter: (item: TrackWithMatching) => item.matching.artist.contains && item.matching.title.similarity >= .85 },
                { reason: 'Artist contains and Title contains and Album contains', filter: (item: TrackWithMatching) => item.matching.artist.contains && item.matching.title.contains && item.matching.album.contains },
                // Artist & track similarit scores
                { reason: 'Artist and Title has 85% similarity', filter: (item: TrackWithMatching) => item.matching.artist.similarity >= 0.85 && item.matching.title.similarity >= 0.85 },
                { reason: 'Artist with Title and Title has 85% similarity', filter: (item: TrackWithMatching) => item.matching.artistWithTitle.similarity >= 0.8 && item.matching.title.similarity >= 0.9 },
                { reason: 'Artist with Title has 85% similarity', filter: (item: TrackWithMatching) => item.matching.artistWithTitle.similarity >= 0.95 },
                // Artist & track contains
                { reason: 'Artist and Title contains', filter: (item: TrackWithMatching) => item.matching.artist.contains && item.matching.title.contains },
                // Album matches & track is a bit similar
                { reason: 'Artist has 70% similarity, Album and Title matches', filter: (item: TrackWithMatching) => item.matching.artist.similarity >= 0.7 && item.matching.album.match && item.matching.title.match },
                { reason: 'Artist has 70% similarity, Album matchs and Title has 85% similarity', filter: (item: TrackWithMatching) => item.matching.artist.similarity >= 0.7 && item.matching.album.match && item.matching.title.similarity >= 0.85 },
                { reason: 'Album matches, Artist contains and Title has 80% similiarity', filter: (item: TrackWithMatching) => item.matching.album.match && item.matching.artist.contains && item.matching.title.similarity >= 0.8 }
            ]
        } = this.config


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
            const { reason, filter } = matchFilters[i];
            const result = results.filter(filter)
            if (result.length > 0) {
                // Return matching tracks
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
}

export * from './types';
export * from './utils';

