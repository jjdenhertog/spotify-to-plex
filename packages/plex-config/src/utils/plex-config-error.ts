export class PlexConfigError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PlexConfigError';
  }
}