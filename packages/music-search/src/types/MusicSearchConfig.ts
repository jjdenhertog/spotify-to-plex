import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';
import { TextProcessingConfig } from './TextProcessingConfig';
import { SearchApproachConfig } from './SearchApproachConfig';

/**
 * Complete music search configuration - simplified
 */
export type MusicSearchConfig = {
    matchFilters: MatchFilterConfig[];
    textProcessing: TextProcessingConfig;
    searchApproaches: SearchApproachConfig[];
    options: {
        enableCaching: boolean;
        maxCacheSize: number;
        debugMode: boolean;
    };
}