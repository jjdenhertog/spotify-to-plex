export class PlexConnectionError extends Error {
    public constructor(message: string = 'No Plex connection found') {
        super(message);
        this.name = 'PlexConnectionError';
    }
}