export type PlexSettings = {
  readonly id: string;
  readonly uri: string;
  readonly token: string;
  readonly serverToken?: string;
  readonly pin_code?: string;
  readonly pin_id?: string;
}