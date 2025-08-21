// Shared type definitions

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration?: number;
  isrc?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  releaseDate?: string;
  tracks?: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  owner?: string;
}

export interface SyncResult {
  success: boolean;
  added: number;
  removed: number;
  failed: number;
  errors?: string[];
}

export interface SearchConfig {
  searchApproach?: 'fast' | 'balanced' | 'accurate';
  matchFilters?: MatchFilter[];
  minimumScore?: number;
}

export interface MatchFilter {
  field: 'title' | 'artist' | 'album';
  weight?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}