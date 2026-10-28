/**
 * Links to external tools that seed a MusicBrainz release from a Spotify album.
 * Both prefill everything they can scrape (tracklist, artists, UPC, ISRCs, cover),
 * and the resulting release gets the Spotify URL relation our mapping lookup relies on.
 */
export function getMusicBrainzSeederUrls(spotifyAlbumId: string) {
    const albumUrl = encodeURIComponent(`https://open.spotify.com/album/${spotifyAlbumId}`);

    return {
        harmony: `https://harmony.pulsewidth.org.uk/release?url=${albumUrl}&category=preferred`,
        sambl: `https://sambl.lioncat6.com/seed?url=${albumUrl}`
    };
}
