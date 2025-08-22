import type { NextApiRequest, NextApiResponse } from 'next';
export type GetPlexResourcesResponse = {
    name: string;
    id: string;
    connections: {
        uri: string;
        local: boolean;
    }[];
};
declare const _default: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
export default _default;
//# sourceMappingURL=resources.d.ts.map