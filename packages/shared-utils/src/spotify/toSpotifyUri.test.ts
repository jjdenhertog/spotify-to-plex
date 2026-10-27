import { describe, expect, it } from 'vitest';
import { toSpotifyUri } from './toSpotifyUri';

describe('toSpotifyUri', () => {

    it('turns every link form into the URI', () => {
        expect(toSpotifyUri('spotify:playlist:37i9dQZF1EQqA6klNdJvwx')).toBe('spotify:playlist:37i9dQZF1EQqA6klNdJvwx');
        expect(toSpotifyUri('https://open.spotify.com/playlist/37i9dQZF1EQqA6klNdJvwx?si=abc123')).toBe('spotify:playlist:37i9dQZF1EQqA6klNdJvwx');
        expect(toSpotifyUri('https://open.spotify.com/intl-nl/album/4aawyAB9vmqN3uQ7FjRGTy')).toBe('spotify:album:4aawyAB9vmqN3uQ7FjRGTy');
        expect(toSpotifyUri('https://open.spotify.com/user/spotify/playlist/37i9dQZF1EQqA6klNdJvwx')).toBe('spotify:playlist:37i9dQZF1EQqA6klNdJvwx');
        expect(toSpotifyUri(' https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl ')).toBe('spotify:track:11dFghVXANMlKmJXsNCbNl');

        for (const bad of ['', 'daylist', 'spotify:playlist', 'https://example.com/playlist/abc', 'https://open.spotify.com/'])
            expect(toSpotifyUri(bad), bad).toBeNull();
    });
});
