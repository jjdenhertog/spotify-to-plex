import { NextApiRequest, NextApiResponse } from 'next';
import { getMatchFilters } from '@spotify-to-plex/music-search/functions/getMatchFilters';
import { updateMatchFilters } from '@spotify-to-plex/music-search/functions/updateMatchFilters';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';

/**
 * API response types
 */
type GetResponse = MatchFilterConfig[];

type PostSuccessResponse = {
    success: true;
    message: string;
    filters: MatchFilterConfig[];
};

type ErrorResponse = {
    error: string;
    details?: string;
};

/**
 * Validate expression filters
 */
function validateExpressions(filters: MatchFilterConfig[]): string | null {
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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GetResponse | PostSuccessResponse | ErrorResponse>
) {
    const storageDir = getStorageDir();

    if (req.method === 'GET') {
        try {
            const filters = await getMatchFilters(storageDir);

            return res.status(200).json([...filters]);
        } catch (_error) {
            // Error handling - handled by Next.js error boundary

            return res.status(500).json({
                error: 'Failed to load match filters',
                details: _error instanceof Error ? _error.message : 'Unknown error'
            });
        }
    }

    if (req.method === 'POST') {
        try {
            const newFilters = req.body as MatchFilterConfig[];
            
            // Validate the filters
            const validationError = validateExpressions(newFilters);
            if (validationError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validationError
                });
            }

            // Update filters
            await updateMatchFilters(storageDir, newFilters);
            
            // Return success response
            return res.status(200).json({
                success: true,
                message: 'Match filters updated successfully',
                filters: newFilters
            });
        } catch (_error) {
            // Error handling - handled by Next.js error boundary

            return res.status(500).json({
                error: 'Failed to update match filters',
                details: _error instanceof Error ? _error.message : 'Unknown error'
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}