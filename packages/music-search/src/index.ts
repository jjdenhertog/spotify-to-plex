/* eslint-disable @typescript-eslint/no-empty-function */
import { SearchConfig } from "./types/SearchConfig";
import { Track } from "./types/Track";
import { TrackWithMatching } from "./types/TrackWithMatching";
import { compareTitles } from "./utils/compareTitles";
import { removeFeaturing } from "./utils/removeFeaturing";
import { MusicSearchConfig, RuntimeMatchFilter } from "./types/config";
import { ConfigCompiler } from "./config/config-compiler";
import { DEFAULT_MUSIC_SEARCH_CONFIG } from "./config/default-config";

export default class MusicSearch {

    private _config?: SearchConfig
    private _musicSearchConfig?: MusicSearchConfig
    private _runtimeFilters?: RuntimeMatchFilter[]

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

    /**
     * Set music search configuration - provides compiled runtime filters
     * This replaces the hardcoded match filters with configurable ones
     */
    public setMusicSearchConfig(config: MusicSearchConfig): void {
        this._musicSearchConfig = config;
        this._runtimeFilters = ConfigCompiler.compileMatchFilters(config.matchFilters);
    }

    /**
     * Get current music search configuration, using defaults if not set
     */
    public getMusicSearchConfig(): MusicSearchConfig {
        return this._musicSearchConfig ?? DEFAULT_MUSIC_SEARCH_CONFIG;
    }

    /**
     * Get compiled runtime filters, compiling from default config if not set
     */
    private getRuntimeFilters(): RuntimeMatchFilter[] {
        if (!this._runtimeFilters) {
            const config = this.getMusicSearchConfig();
            this._runtimeFilters = ConfigCompiler.compileMatchFilters(config.matchFilters);
        }

        return this._runtimeFilters;
    }

    public search(find: Track, options: Track[], includeMatching: boolean = false): Track[] {

        // Use compiled runtime filters from configuration (preserves all hardcoded logic)
        const matchFilters = this.getRuntimeFilters();


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
export * from './config/default-config';
export * from './config/music-search-config-manager';
export * from './config/config-compiler';

