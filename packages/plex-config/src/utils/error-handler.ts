export class PlexConfigError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PlexConfigError';
  }
}

export class StorageError extends PlexConfigError {
  constructor(message: string, cause?: Error) {
    super(message, 'STORAGE_ERROR', cause);
  }
}

export class ValidationError extends PlexConfigError {
  constructor(message: string, public readonly field: string) {
    super(message, 'VALIDATION_ERROR');
  }
}