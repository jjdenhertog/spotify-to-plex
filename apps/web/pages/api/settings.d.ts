import type { NextApiRequest, NextApiResponse } from 'next';
export type GetSettingsResponse = {
    loggedin: boolean;
    uri?: string;
    id?: string;
};
declare const _default: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
export default _default;
//# sourceMappingURL=settings.d.ts.map