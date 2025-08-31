import { MatchFilterConfig } from './MatchFilterConfig';
import { TextProcessingConfig } from './TextProcessingConfig';
import { PlatformSearchConfig } from './PlatformSearchConfig';

/**
 * Complete music search configuration - simplified
 */
export type MusicSearchConfig = {
  readonly matchFilters: readonly MatchFilterConfig[];
  readonly textProcessing: TextProcessingConfig;
  readonly searchApproaches: PlatformSearchConfig;
  readonly options: {
    readonly enableCaching: boolean;
    readonly maxCacheSize: number;
    readonly debugMode: boolean;
  };
}