export type SpotifyImage = {
    // SpotifyScraper 3.9.x no longer reports dimensions, so these can be null.
    height: number | null;
    url: string;
    width: number | null;
};