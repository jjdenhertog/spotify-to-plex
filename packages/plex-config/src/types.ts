// Settings Types
export type PlexSettings = {
  readonly id?: string;
  readonly uri?: string;
  readonly token?: string;
  readonly pin_code?: string;
  readonly pin_id?: string;
}

export type PlexSettingsUpdate = {
  id?: string;
  uri?: string;
  token?: string;
  pin_code?: string;
  pin_id?: string;
}

// Playlist Types
export type PlaylistItem = {
  readonly type: string;
  readonly id: string;
  readonly plex: string;
}

export type PlexPlaylists = {
  readonly data?: readonly PlaylistItem[];
}

export type PlaylistUpdate = {
  type: string;
  id: string;
  plex: string;
}

// Configuration Options
export type PlexConfigOptions = {
  storageDir: string;
  preloadCache?: boolean; // Default true
}

// Legacy event types (exported for compatibility but not used)
export type ConfigEvent<T = any> = {
  readonly type: string;
  readonly timestamp: number;
  readonly data: T;
}

export type SettingsUpdatedEvent = {
  readonly type: 'settings:updated';
  readonly previous: PlexSettings | null;
} & ConfigEvent<PlexSettings>

export type PlaylistUpdatedEvent = {
  readonly type: 'playlist:updated';
  readonly action: 'added' | 'removed' | 'updated';
} & ConfigEvent<PlaylistItem>

export type PlexConfigEvent = SettingsUpdatedEvent | PlaylistUpdatedEvent;