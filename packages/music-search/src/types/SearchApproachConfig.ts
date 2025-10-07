/**
 * Search approach configuration - simple flags
 */
export type SearchApproachConfig = {
    id: string;
    filtered?: boolean;
    trim?: boolean;
    ignoreQuotes?: boolean;
    removeQuotes?: boolean; // Plex-specific flag
    force?: boolean; // Plex-specific flag
}