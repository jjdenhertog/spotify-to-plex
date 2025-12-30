// Type exports
export type { SlskdCredentials } from './types/SlskdCredentials';
export type { SlskdSearchRequest } from './types/SlskdSearchRequest';
export type { SlskdSearchResponse } from './types/SlskdSearchResponse';
export type { SlskdFile } from './types/SlskdFile';
export type { SlskdFileAttribute } from './types/SlskdFileAttribute';
export type { SlskdMusicSearchApproach } from './types/SlskdMusicSearchApproach';
export type { SlskdMusicSearchTrack } from './types/SlskdMusicSearchTrack';
export type { SlskdTrack } from './types/SlskdTrack';
export type { SearchResponse } from './types/SearchResponse';
export type { SearchQuery } from './types/SearchQuery';
export type { SlskdMusicSearchConfig } from './types/SlskdMusicSearchConfig';

// Core search functions (Tidal-compatible API)
export { search } from './functions/search';
export { newTrackSearch } from './functions/newTrackSearch';
export { analyze } from './functions/analyze';

// Session management
export {
    setState,
    getState,
    getConfig,
    setMusicSearchConfig,
    addToCache,
    getFromCache,
    resetCache,
    clearState
} from './session/state';

// Actions
export { queueDownload } from './actions/queueDownload';
export type { SlskdDownloadFile } from './actions/queueDownload';

// Utilities
export {
    extractMetadata,
    extractMetadataBatch,
    calculateSuccessRate,
    getExtractionStats
} from './utils/extractMetadata';
export type { ExtractedMetadata, ExtractionResult, ExtractionStats } from './utils/extractMetadata';
export { searchForTrack, clearSearchCache } from './utils/searchForTrack';
export { slskdResultToTracks } from './utils/slskdResultToTracks';
