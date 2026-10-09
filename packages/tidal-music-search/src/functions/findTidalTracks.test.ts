import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackLink } from '@spotify-to-plex/shared-types/common/track';
import { TidalTrack } from '../types/TidalTrack';
import { findTidalTracks } from './findTidalTracks';

const mocks = vi.hoisted(() => ({
    found: [] as TrackLink[],
    add: vi.fn(),
    search: vi.fn(),
    setCredentials: vi.fn()
}));

vi.mock('@spotify-to-plex/shared-utils/cache/getCachedTrackLink', () => ({
    getCachedTrackLinks: () => ({ found: mocks.found, add: mocks.add })
}));
vi.mock('@spotify-to-plex/music-search/functions/getMusicSearchConfig', () => ({
    getMusicSearchConfig: () => Promise.resolve({ searchApproaches: [{ id: 'normal' }, { id: 'filtered', filtered: true }] })
}));
vi.mock('./search', () => ({ search: mocks.search }));
vi.mock('../session/credentials', () => ({ setCredentials: mocks.setCredentials }));

const credentials = { clientId: 'id', clientSecret: 'secret' };

function tidalTrack(id: string): TidalTrack {
    return {
        id,
        title: `Title ${id}`,
        link: `https://tidal.com/track/${id}`,
        artists: [{ name: 'Artist', link: '' }],
        artist: { title: 'Artist' },
        album: { id: `album-${id}`, title: 'Album', link: '' }
    };
}

describe('findTidalTracks', () => {

    beforeEach(() => {
        mocks.found = [];
        mocks.add.mockReset();
        mocks.search.mockReset();
        mocks.setCredentials.mockReset();
        vi.spyOn(console, 'log').mockImplementation(vi.fn());
    });

    it('uses a cached link without searching', async () => {
        mocks.found = [{ spotify_id: 'woodhouse:0123456789abcdef', tidal_id: ['111', '222'] }];

        const result = await findTidalTracks(credentials, [{ id: 'woodhouse:0123456789abcdef', artists: ['A'], title: 'T' }]);

        expect(result).toEqual([{ id: 'woodhouse:0123456789abcdef', tidal_ids: ['111', '222'] }]);
        expect(mocks.search).not.toHaveBeenCalled();
    });

    it('searches only the tracks without a cached link, with the full input', async () => {
        mocks.found = [{ spotify_id: 'cached', tidal_id: ['111'] }];
        const missing = { id: 'woodhouse:fedcba9876543210', artists: ['A', 'B'], title: 'Song (Remastered)', album: 'Album', duration_ms: 183_000 };
        const searchResult = [{ id: missing.id, artist: 'A', title: missing.title, album: 'Album', result: [tidalTrack('333'), tidalTrack('444')] }];
        mocks.search.mockResolvedValue(searchResult);

        const result = await findTidalTracks(credentials, [{ id: 'cached', artists: ['C'], title: 'X' }, missing]);

        expect(mocks.search).toHaveBeenCalledTimes(1);
        const [config, tracks] = mocks.search.mock.calls[0] ?? [];
        expect(tracks).toEqual([missing]);
        expect(config).toMatchObject({ clientId: 'id', clientSecret: 'secret', searchApproaches: [{ id: 'normal' }, { id: 'filtered', filtered: true }] });
        expect(mocks.setCredentials).toHaveBeenCalledWith('id', 'secret');

        expect(result.map(item => item.id)).toEqual(['cached', missing.id]);
        expect(result[1]).toMatchObject({ tidal_ids: ['333', '444'], track: { id: '333', album: { id: 'album-333' } } });
        expect(mocks.add).toHaveBeenCalledWith(searchResult, 'tidal');
    });

    it('leaves tracks without a Tidal match out', async () => {
        mocks.search.mockResolvedValue([{ id: 'x', artist: 'A', title: 'T', album: '', result: [] }]);

        const result = await findTidalTracks(credentials, [{ id: 'x', artists: ['A'], title: 'T' }]);

        expect(result).toEqual([]);
    });

    it('uses the given search approaches over the configured ones', async () => {
        mocks.search.mockResolvedValue([]);

        await findTidalTracks(credentials, [{ id: 'x', artists: ['A'], title: 'T' }], [{ id: 'normal' }]);

        expect(mocks.search.mock.calls[0]?.[0]).toMatchObject({ searchApproaches: [{ id: 'normal' }] });
    });

    it('lets a failing search throw', async () => {
        mocks.search.mockRejectedValue(new Error('Failed authenticating with the Tidal API'));

        await expect(findTidalTracks(credentials, [{ id: 'x', artists: ['A'], title: 'T' }])).rejects.toThrow('Failed authenticating');
        expect(mocks.add).not.toHaveBeenCalled();
    });
});
