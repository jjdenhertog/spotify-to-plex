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