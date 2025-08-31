export class PlexPlaylistError extends Error {
    public constructor(message: string = 'Plex playlist operation failed') {
        super(message);
        this.name = 'PlexPlaylistError';
    }
}