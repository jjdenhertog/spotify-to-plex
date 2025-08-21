// Shared constants

export const DEFAULT_TIMEOUT = 30_000;
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;

export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
export const TIDAL_API_BASE = 'https://api.tidal.com/v1';

export const SYNC_BATCH_SIZE = 50;
export const SEARCH_BATCH_SIZE = 20;

export const MINIMUM_MATCH_SCORE = 0.8;

export const SUPPORTED_AUDIO_FORMATS = [
  'mp3',
  'flac',
  'aac',
  'm4a',
  'ogg',
  'opus',
  'wav'
];

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  VERBOSE: 'verbose'
} as const;

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];