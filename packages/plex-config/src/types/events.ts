import { PlexSettings } from './settings';
import { PlaylistItem } from './playlists';

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