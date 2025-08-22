import { PlexConfigError } from './plex-config-error';

export class ValidationError extends PlexConfigError {
    public constructor(message: string, public readonly field: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}