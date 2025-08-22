export interface PlaylistItem {
  readonly type: string;
  readonly id: string;
  readonly plex: string;
}

export interface PlexPlaylists {
  readonly data?: readonly PlaylistItem[];
}

export interface PlaylistUpdate {
  type: string;
  id: string;
  plex: string;
}