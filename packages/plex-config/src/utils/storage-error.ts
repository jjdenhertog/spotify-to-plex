import { PlexConfigError } from './plex-config-error';

export class StorageError extends PlexConfigError {
    public constructor(message: string, cause?: Error) {
        super(message, 'STORAGE_ERROR', cause);
        this.name = 'StorageError';
    }
}