import { NextApiRequest, NextApiResponse } from 'next';
import { getMatchFilters } from '@spotify-to-plex/music-search/functions/getMatchFilters';
import { updateMatchFilters } from '@spotify-to-plex/music-search/functions/updateMatchFilters';
import { migrateLegacyFilter } from '@spotify-to-plex/music-search/functions/parseExpression';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { validateMatchFilters, getMatchFiltersValidationErrors } from '@spotify-to-plex/shared-utils/validation/validateMatchFilters';
import { MatchFilterConfig } from '@spotify-to-plex/music-search/types/MatchFilterConfig';

/**
 * API response types
 */
type GetResponse = MatchFilterConfig[];

type PostSuccessResponse = {
    success: true;
    message: string;
    filters: MatchFilterConfig[];
    migrated?: {
        count: number;
        details: string[];
    };
};

type ErrorResponse = {
    error: string;
    details?: string[];
    validationErrors?: string[];
};

/**
 * Migrate legacy filters to new expression format if possible
 */
function migrateLegacyFilters(filters: MatchFilterConfig[]): {
    filters: MatchFilterConfig[];
    migrated: { count: number; details: string[] };
} {
    const migrated = { count: 0, details: [] as string[] };
    
    const migratedFilters = filters.map((filter, index) => {
        // If filter has both formats or only expression, no migration needed
        if (filter.expression || !filter.filter) {
            return filter;
        }
        
        // Try to migrate legacy filter to expression
        const migratedExpression = migrateLegacyFilter(filter.filter);
        
        if (migratedExpression) {
            migrated.count++;
            migrated.details.push(`Filter ${index + 1}: "${filter.reason}" migrated to expression format`);
            
            return {
                reason: filter.reason,
                expression: migratedExpression,
                // Keep the legacy filter for backward compatibility during transition
                filter: filter.filter
            } as MatchFilterConfig;
        }
        
        // Keep original filter if migration failed
        return filter;
    });
    
    return { filters: migratedFilters, migrated };
}

export default async function handler(
    req: NextApiRequest, 
    res: NextApiResponse<GetResponse | PostSuccessResponse | ErrorResponse>
) {
    try {
        const storageDir = getStorageDir();

        if (req.method === 'GET') {
            // Get current match filters
            const filters = await getMatchFilters(storageDir);
            
            // Check if migration is requested
            const migrate = req.query.migrate === 'true';
            
            if (migrate) {
                const { filters: migratedFilters, migrated } = migrateLegacyFilters([...filters]);
                
                if (migrated.count > 0) {
                    // Save migrated filters
                    await updateMatchFilters(storageDir, migratedFilters);
                    
                    return res.status(200).json({
                        success: true,
                        message: `Successfully migrated ${migrated.count} filter(s) to expression format`,
                        filters: migratedFilters,
                        migrated
                    } as PostSuccessResponse);
                }
            }

            return res.status(200).json([...filters]);
            
        } else if (req.method === 'POST') {
            // Update match filters
            const newFilters = req.body;
            
            // Validate the filters with detailed error reporting
            const validation = getMatchFiltersValidationErrors(newFilters);
            
            if (!validation.valid) {
                return res.status(400).json({ 
                    error: 'Invalid match filters format',
                    details: [
                        'Expected array of objects with:',
                        '- reason: string (required)',
                        '- filter: string (legacy format, optional)',
                        '- expression: string (new format, optional)',
                        'At least one of "filter" or "expression" must be provided'
                    ],
                    validationErrors: validation.errors
                } as ErrorResponse);
            }
            
            // Basic validation passed, now validate with existing function
            if (!validateMatchFilters(newFilters)) {
                return res.status(400).json({ 
                    error: 'Match filters failed validation',
                    details: ['One or more filters contain invalid data or expressions']
                } as ErrorResponse);
            }
            
            const updatedFilters = await updateMatchFilters(storageDir, newFilters);

            return res.status(200).json({ 
                success: true, 
                message: 'Match filters updated successfully',
                filters: updatedFilters
            } as PostSuccessResponse);
            
        } else if (req.method === 'PUT') {
            // Migrate legacy filters to expression format
            const currentFilters = await getMatchFilters(storageDir);
            const { filters: migratedFilters, migrated } = migrateLegacyFilters([...currentFilters]);
            
            if (migrated.count > 0) {
                await updateMatchFilters(storageDir, migratedFilters);
                
                return res.status(200).json({
                    success: true,
                    message: `Successfully migrated ${migrated.count} filter(s) to expression format`,
                    filters: migratedFilters,
                    migrated
                } as PostSuccessResponse);
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'No filters required migration',
                    filters: currentFilters
                } as PostSuccessResponse);
            }
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT']);

        return res.status(405).json({ 
            error: 'Method not allowed',
            details: ['Supported methods: GET, POST (update), PUT (migrate)']
        } as ErrorResponse);
        
    } catch (error) {
        console.error('Error in match filters API:', error);

        return res.status(500).json({ 
            error: 'Internal server error', 
            details: [error instanceof Error ? error.message : 'Unknown error']
        } as ErrorResponse);
    }
}