/**
 * Plex server settings interface
 */
export type PlexSettings = {
  uri: string;
  token: string;
  id: string;
}

/**
 * Playlist item for Plex operations
 */
export type PlaylistItem = {
  key: string;
  source?: string;
}

/**
 * Plex playlist data for updates
 */
export type PlaylistUpdateData = {
  title: string;
}

/**
 * Configuration for retry attempts
 */
export type RetryConfig = {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * API URL helper function type
 */
export type GetAPIUrlFn = (baseUri: string, endpoint: string) => string;

/**
 * Error types for Plex operations
 */
export class PlexConnectionError extends Error {
  constructor(message: string = 'No Plex connection found') {
    super(message);
    this.name = 'PlexConnectionError';
  }
}

export class PlexPlaylistError extends Error {
  constructor(message: string = 'Plex playlist operation failed') {
    super(message);
    this.name = 'PlexPlaylistError';
  }
}