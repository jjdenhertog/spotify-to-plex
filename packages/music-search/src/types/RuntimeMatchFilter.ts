import { Track } from "./Track";

/**
 * Runtime filter function type - for converted function strings
 */
export type RuntimeMatchFilter = {
    reason: string;
    filter: (item: Track) => boolean;
}