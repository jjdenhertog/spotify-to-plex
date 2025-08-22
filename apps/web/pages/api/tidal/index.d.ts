import type { NextApiRequest, NextApiResponse } from 'next';
export type GetTidalTracksResponse = {
    id: string;
    title: string;
    artist: string;
    album: string;
    tidal_ids?: string[];
};
declare const _default: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
export default _default;
//# sourceMappingURL=index.d.ts.map