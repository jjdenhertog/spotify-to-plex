// Shared type definitions

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration?: number;
  isrc?: string;
}

export type Album = {
  id: string;
  title: string;
  artist: string;
  releaseDate?: string;
  tracks?: Track[];
}

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  owner?: string;
}

export type SyncResult = {
  success: boolean;
  added: number;
  removed: number;
  failed: number;
  errors?: string[];
}

export type SearchConfig = {
  searchApproach?: 'fast' | 'balanced' | 'accurate';
  matchFilters?: MatchFilter[];
  minimumScore?: number;
}

export type MatchFilter = {
  field: 'title' | 'artist' | 'album';
  weight?: number;
}

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}