import { TrackWithMatching } from "./TrackWithMatching";

export type MatchFilter = { reason: string, filter: (item: TrackWithMatching) => boolean };
