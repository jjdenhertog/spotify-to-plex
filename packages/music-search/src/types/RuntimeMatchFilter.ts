import { TrackWithMatching } from './TrackWithMatching';

/**
 * Runtime filter function type - for converted function strings
 */
export type RuntimeMatchFilter = {
  readonly reason: string;
  readonly filter: (item: TrackWithMatching) => boolean;
}