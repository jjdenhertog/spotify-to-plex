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