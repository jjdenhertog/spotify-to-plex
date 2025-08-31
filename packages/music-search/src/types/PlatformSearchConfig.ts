import { SearchApproachConfig } from './SearchApproachConfig';

/**
 * Platform-specific search approaches
 */
export type PlatformSearchConfig = {
  readonly plex: readonly SearchApproachConfig[];
  readonly tidal: readonly SearchApproachConfig[];
}