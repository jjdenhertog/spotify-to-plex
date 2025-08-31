/**
 * Simple match filter configuration with function strings
 */
export type MatchFilterConfig = {
  readonly reason: string;
  readonly filter: string; // Function string like "(item) => item.matching.artist.match && item.matching.title.match"
}