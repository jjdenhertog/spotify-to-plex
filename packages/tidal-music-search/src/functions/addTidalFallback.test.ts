import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TidalLookup } from '../types/TidalLookup';
import { TidalTrack } from '../types/TidalTrack';
import { addTidalFallback } from './addTidalFallback';

const mocks = vi.hoisted(() => ({
    findTidalTracks: vi.fn(),
    getTrackByIds: vi.fn(),
    authenticate: vi.fn()
}));

vi.mock('./findTidalTracks', () => ({ findTidalTracks: mocks.findTidalTracks }));
vi.mock('../utils/tidal/getTrackByIds', () => ({ getTrackByIds: mocks.getTrackByIds }));
vi.mock('../session/credentials', () => ({ setCredentials: vi.fn(), authenticate: mocks.authenticate }));

function tidalTrack(id: string): TidalTrack {
    return {
        id,
        title: 'Insomnia',
        link: `https://tidal.com/track/${id}`,
        artists: [{ name: 'Faithless', link: '' }, { name: 'Sister Bliss', link: '' }],
        artist: { title: 'Faithless' },
        album: { id: `album-${id}`, title: 'Reverence', link: '' },
        duration_ms: 522_000
    };
}

const items = [
    { id: 'woodhouse:00000000000000a1', artists: ['Plex Artist'], title: 'In Plex' },
    { id: 'woodhouse:00000000000000b2', artists: ['Faithless', 'Sister Bliss'], title: 'Insomnia', album: 'Reverence', duration_ms: 522_000 },
    { id: 'woodhouse:00000000000000c3', artists: ['Nobody'], title: 'Nowhere' }
];

const plexTrack = { id: '/library/metadata/1', title: 'In Plex', artist: { title: 'Plex Artist' } };

function rows() {
    return [
        { id: items[0]!.id, artist: 'Plex Artist', title: 'In Plex', album: '', result: [plexTrack] },
        { id: items[1]!.id, artist: 'Faithless', title: 'Insomnia', album: 'Reverence', duration_ms: 522_000, result: [] },
        { id: items[2]!.id, artist: 'Nobody', title: 'Nowhere', album: '', result: [] }
    ];
}

describe('addTidalFallback', () => {

    beforeEach(() => {
        vi.stubEnv('TIDAL_API_CLIENT_ID', 'id');
        vi.stubEnv('TIDAL_API_CLIENT_SECRET', 'secret');
        mocks.findTidalTracks.mockReset();
        mocks.getTrackByIds.mockReset();
        mocks.authenticate.mockReset();
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('marks plex, tidal and none rows', async () => {
        const lookups: TidalLookup[] = [{ id: items[1]!.id, tidal_ids: ['77', '78'], track: tidalTrack('77') }];
        mocks.findTidalTracks.mockResolvedValue(lookups);

        const [plex, tidal, none] = await addTidalFallback(rows(), items, [{ id: 'normal' }]);

        expect(plex).toEqual({ ...rows()[0], status: 'plex' });
        expect(tidal).toEqual({
            ...rows()[1],
            status: 'tidal',
            tidal_ids: ['77', '78'],
            tidal_album_id: 'album-77',
            tidal_match: { artist: 'Faithless, Sister Bliss', title: 'Insomnia', album: 'Reverence', duration_ms: 522_000 }
        });
        expect(none).toEqual({ ...rows()[2], status: 'none', tidal_ids: [] });
    });

    it('only looks up the missing rows, with their full input', async () => {
        mocks.findTidalTracks.mockResolvedValue([]);

        await addTidalFallback(rows(), items, [{ id: 'normal' }]);

        expect(mocks.findTidalTracks).toHaveBeenCalledWith({ clientId: 'id', clientSecret: 'secret' }, [items[1], items[2]], [{ id: 'normal' }]);
    });

    it('does not touch Tidal when Plex found everything', async () => {
        const [first] = rows();

        const result = await addTidalFallback([first!], [items[0]!]);

        expect(result).toEqual([{ ...first, status: 'plex' }]);
        expect(mocks.findTidalTracks).not.toHaveBeenCalled();
    });

    it('reports unconfigured without credentials', async () => {
        vi.stubEnv('TIDAL_API_CLIENT_SECRET', ' ');

        const [plex, missing] = await addTidalFallback(rows(), items);

        expect(plex?.status).toBe('plex');
        expect(missing).toMatchObject({ status: 'none', tidal_ids: [], tidal_error: 'unconfigured' });
        expect(mocks.findTidalTracks).not.toHaveBeenCalled();
    });

    it('keeps the Plex rows when the Tidal search fails', async () => {
        mocks.findTidalTracks.mockRejectedValue(new Error('Failed authenticating with the Tidal API'));

        const [plex, first, second] = await addTidalFallback(rows(), items);

        expect(plex).toEqual({ ...rows()[0], status: 'plex' });
        expect(first).toMatchObject({ status: 'none', tidal_ids: [], tidal_error: 'failed' });
        expect(second).toMatchObject({ status: 'none', tidal_ids: [], tidal_error: 'failed' });
    });

    it('describes a cached link by its best Tidal id', async () => {
        mocks.findTidalTracks.mockResolvedValue([{ id: items[1]!.id, tidal_ids: ['77', '78'] }]);
        mocks.getTrackByIds.mockResolvedValue([tidalTrack('77')]);

        const [, tidal] = await addTidalFallback(rows(), items);

        expect(mocks.getTrackByIds).toHaveBeenCalledWith(['77'], 'NL');
        expect(tidal).toMatchObject({ status: 'tidal', tidal_ids: ['77', '78'], tidal_album_id: 'album-77', tidal_match: { title: 'Insomnia' } });
    });

    it('keeps the cached ids when describing them fails', async () => {
        mocks.findTidalTracks.mockResolvedValue([{ id: items[1]!.id, tidal_ids: ['77'] }]);
        mocks.authenticate.mockRejectedValue(new Error('Tidal down'));

        const [, tidal] = await addTidalFallback(rows(), items);

        expect(tidal).toEqual({ ...rows()[1], status: 'tidal', tidal_ids: ['77'] });
    });
});
