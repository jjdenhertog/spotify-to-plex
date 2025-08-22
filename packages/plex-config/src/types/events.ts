import { PlexSettings } from './settings';
import { PlaylistItem } from './playlists';

export interface ConfigEvent<T = any> {
  readonly type: string;
  readonly timestamp: number;
  readonly data: T;
}

export interface SettingsUpdatedEvent extends ConfigEvent<PlexSettings> {
  readonly type: 'settings:updated';
  readonly previous: PlexSettings | null;
}

export interface PlaylistUpdatedEvent extends ConfigEvent<PlaylistItem> {
  readonly type: 'playlist:updated';
  readonly action: 'added' | 'removed' | 'updated';
}

export type PlexConfigEvent = SettingsUpdatedEvent | PlaylistUpdatedEvent;