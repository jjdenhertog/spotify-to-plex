import { generateError } from '@/helpers/errors/generateError';
import { configDir } from "@/library/configDir";
import { SyncLog } from 'cronjob/albums';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {

            const logsPath = join(configDir, 'sync_log.json')
            if (!existsSync(logsPath))
                return res.status(200).json([])

            const logs: SyncLog[] = JSON.parse(readFileSync(logsPath, 'utf8'))

            return res.status(200).json(logs.sort((a, b) => b.start - a.start))
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Logs", err);
    },
});


