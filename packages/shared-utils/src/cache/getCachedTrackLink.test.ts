import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedTrackLinks } from './getCachedTrackLink';

describe('getCachedTrackLinks', () => {
    let dir = '';

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'track-links-'));
        vi.stubEnv('STORAGE_DIR', dir);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        rmSync(dir, { recursive: true, force: true });
    });

    const hit = { id: 'woodhouse:0123456789abcdef', artists: ['Faithless'], title: 'Insomnia' };
    const miss = { id: 'woodhouse:fedcba9876543210', artists: ['Nobody'], title: 'Nowhere' };

    it('caches a match under any string id and finds it again', () => {
        getCachedTrackLinks([hit, miss], 'tidal').add([
            { id: hit.id, artist: 'Faithless', title: 'Insomnia', result: [{ id: '77' }, { id: '78' }] },
            { id: miss.id, artist: 'Nobody', title: 'Nowhere', result: [] }
        ], 'tidal');

        const { found } = getCachedTrackLinks([hit, miss], 'tidal');

        expect(found).toEqual([{ spotify_id: hit.id, tidal_id: ['77', '78'] }]);
    });

    it('does not cache a miss', () => {
        getCachedTrackLinks([miss], 'tidal').add([{ id: miss.id, artist: 'Nobody', title: 'Nowhere', result: [] }], 'tidal');

        expect(JSON.parse(readFileSync(join(dir, 'track_links.json'), 'utf8'))).toEqual([]);
    });

    it('keeps the tidal and plex links of one id apart', () => {
        getCachedTrackLinks([hit], 'plex').add([{ id: hit.id, artist: 'Faithless', title: 'Insomnia', result: [{ id: '/library/metadata/1' }] }], 'plex');

        expect(getCachedTrackLinks([hit], 'tidal').found).toEqual([]);
        expect(getCachedTrackLinks([hit], 'plex').found).toHaveLength(1);
    });
});
