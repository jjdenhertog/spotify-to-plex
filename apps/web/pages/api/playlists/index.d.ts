import { Playlist } from '@/types/PlexAPI';
import type { NextApiRequest, NextApiResponse } from 'next';
export type GetPlexPlaylistResponse = {
    key: Playlist["key"];
    guid: Playlist["guid"];
    title: Playlist["title"];
};
declare const _default: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
export default _default;
//# sourceMappingURL=index.d.ts.map