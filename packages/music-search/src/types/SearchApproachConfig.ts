/**
 * Search approach configuration - simple flags
 */
export type SearchApproachConfig = {
  readonly id: string;
  readonly filtered?: boolean;
  readonly trim?: boolean;
  readonly ignoreQuotes?: boolean;
  readonly removeQuotes?: boolean; // Plex-specific flag
  readonly force?: boolean; // Plex-specific flag
}