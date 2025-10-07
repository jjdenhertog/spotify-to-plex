import { Track } from "./Track";

export type MatchFilter = { reason: string, filter: (item: Track) => boolean };
