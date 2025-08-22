import type { NextApiRequest, NextApiResponse } from 'next';

export function generateError(req: NextApiRequest, res: NextApiResponse, subject: string, error: unknown) {
    let action: string;
    switch (req.method) {
        case "POST":
            action = "create";
            break;
        case "PUT":
            action = "update";
            break;
        case "DELETE":
            action = "delete";
            break;
        default:
        case "GET":
            action = 'load';
            break;
    }
    if (typeof error == 'string') {
        res.status(400).json({ error });
    } else if (error instanceof Error && typeof error.message == 'string') {
        res.status(400).json({ error: error.message });
    } else {
        res.status(400).json({ error: `Could not ${action} ${subject}` });
    }
}
