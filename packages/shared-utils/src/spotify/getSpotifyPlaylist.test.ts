import { describe, expect, it } from 'vitest';

import { getSpotifyPlaylist } from './getSpotifyPlaylist';

const TOTAL = 250;

function track(index: number) {
    return {
        track: {
            id: `track-${index}`,
            name: `Track ${index}`,
            uri: `spotify:track:${index}`,
            artists: [{ name: 'Artist A, Artist B' }],
            album: { id: 'album-1', name: 'Album' },
            duration_ms: 1000 + index
        }
    };
}

function fakeApi(total: number) {
    const requests: { limit: number; offset: number }[] = [];

    const api = {
        playlists: {
            getPlaylist: async () => ({
                id: 'playlist-1',
                name: 'Playlist',
                owner: { display_name: 'Owner' },
                images: [{ url: 'image.jpg' }],
                tracks: {
                    total,
                    items: Array.from({ length: Math.min(100, total) }, (_v, i) => track(i))
                }
            }),
            getPlaylistItems: async (_id: string, _market: unknown, _fields: unknown, limit: number, offset: number) => {
                requests.push({ limit, offset });

                return {
                    total,
                    items: Array.from({ length: Math.max(0, Math.min(limit, total - offset)) }, (_v, i) => track(offset + i))
                };
            }
        }
    };

    return { api, requests };
}

describe('getSpotifyPlaylist', () => {
    it('pages past the first 100 tracks', async () => {
        const { api, requests } = fakeApi(TOTAL);
        const playlist = await getSpotifyPlaylist(api as any, 'playlist-1', false);

        expect(playlist?.tracks).toHaveLength(TOTAL);
        expect(playlist?.tracks.at(-1)?.id).toBe(`track-${TOTAL - 1}`);
        expect(playlist?.tracks[0]?.artists).toEqual(['Artist A', 'Artist B']);
        expect(requests[0]).toEqual({ limit: 50, offset: 100 });
    }, 30_000);

    it('stops at 500 tracks', async () => {
        const { api } = fakeApi(1200);
        const playlist = await getSpotifyPlaylist(api as any, 'playlist-1', false);

        expect(playlist?.tracks).toHaveLength(500);
        expect(playlist?.tracks.at(-1)?.id).toBe('track-499');
    }, 30_000);

    it('stops at the first page when simplified', async () => {
        const { api, requests } = fakeApi(TOTAL);
        const playlist = await getSpotifyPlaylist(api as any, 'playlist-1', true);

        expect(playlist?.tracks).toHaveLength(100);
        expect(requests).toHaveLength(0);
    });
});
