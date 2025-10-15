/**
 * MusicBrainz API rate limiting helper
 * MusicBrainz requires 1 request per second for anonymous usage
 */
export async function rateLimitDelay(duration: number = 1000) {
    await new Promise(resolve => { setTimeout(resolve, duration) });
}
