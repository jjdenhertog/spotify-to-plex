/**
 * Match filter configuration supporting both legacy function strings and new expression format
 * 
 * @example Legacy format:
 * {
 *   reason: "Artist and Title match",
 *   filter: "(item) => item.matching.artist.match && item.matching.title.match"
 * }
 * 
 * @example New expression format:
 * {
 *   reason: "Artist and Title match",
 *   expression: "artist:match AND title:match"
 * }
 */
export type MatchFilterConfig = {
  readonly reason: string;
  readonly filter?: string; // Legacy function string - kept for backward compatibility
  readonly expression?: string; // New expression format - preferred for new configs
};

/**
 * New match filter configuration using only the expression format
 * Used for migrated configs and new configurations
 */
export type NewMatchFilterConfig = {
  readonly reason: string;
  readonly expression: string;
};