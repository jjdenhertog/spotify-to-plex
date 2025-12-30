import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { generateError } from '@/helpers/errors/generateError';
import { getMatchFilters } from '@spotify-to-plex/music-search/functions/getMatchFilters';
import { updateMatchFilters } from '@spotify-to-plex/music-search/functions/updateMatchFilters';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            try {
                const storageDir = getStorageDir();
                const filters = await getMatchFilters(storageDir);

                return res.status(200).json([...filters]);
            } catch (error) {
                return res.status(500).json({
                    error: 'Failed to load match filters',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        })
    .post(
        async (req, res) => {
            try {
                const storageDir = getStorageDir();
                const newFilters = req.body as MatchFilterConfig[];

                const validationError = validateExpressions(newFilters);
                if (validationError) {
                    return res.status(400).json({
                        error: 'Validation failed',
                        details: validationError
                    });
                }

                await updateMatchFilters(storageDir, newFilters);

                return res.status(200).json({
                    success: true,
                    message: 'Match filters updated successfully',
                    filters: newFilters
                });
            } catch (error) {
                return res.status(500).json({
                    error: 'Failed to update match filters',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Match Filters", err);
    }
});




/**
 * Validate expression filters
 */
function validateExpressions(filters: MatchFilterConfig[]) {
    if (!Array.isArray(filters)) {
        return 'Filters must be an array';
    }

    for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (typeof filter !== 'string') {
            return `Filter at index ${i} must be a string expression`;
        }

        if (!(filter).trim()) {
            return `Filter at index ${i} cannot be empty`;
        }

        // Basic expression validation - allow both complete (field:operation) and incomplete (field) conditions
        const fieldPattern = '(artist|title|album|artistWithTitle|artistInTitle)';
        const operationPattern = String.raw`:(match|contains|similarity>=\d*\.?\d+)`;
        const conditionPattern = `${fieldPattern}(${operationPattern})?`; // Operation is optional
        const validPattern = new RegExp(String.raw`^${conditionPattern}(\s+(AND|OR)\s+${conditionPattern})*$`);

        if (!validPattern.test((filter).trim())) {
            return `Filter at index ${i} has invalid expression format`;
        }
    }

    return null;
}