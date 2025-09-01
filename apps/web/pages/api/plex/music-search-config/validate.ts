import { NextApiRequest, NextApiResponse } from 'next';
import { validateExpression } from '@spotify-to-plex/shared-utils/validation/validateExpression';
import { getMatchFilterValidationErrors } from '@spotify-to-plex/shared-utils/validation/getMatchFilterValidationErrors';
import { migrateLegacyFilter } from '@spotify-to-plex/music-search/functions/parseExpression';
import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';

/**
 * API response types for validation endpoint
 */
type ValidateExpressionRequest = {
    expression: string;
};

type ValidateFilterRequest = {
    filter: MatchFilterConfig;
};

type MigrateLegacyRequest = {
    legacyFilter: string;
};

type ValidateExpressionResponse = {
    valid: boolean;
    errors: string[];
    expression: string;
};

type ValidateFilterResponse = {
    valid: boolean;
    errors: string[];
    filter: MatchFilterConfig;
};

type MigrateLegacyResponse = {
    success: boolean;
    originalFilter: string;
    migratedExpression: string | null;
    errors?: string[];
};

type ErrorResponse = {
    error: string;
    details?: string[];
};

/**
 * Validation API endpoint for match filters and expressions
 * 
 * POST /api/plex/music-search-config/validate
 * 
 * Body can be one of:
 * - { expression: string } - Validate expression syntax
 * - { filter: MatchFilterConfig } - Validate complete filter
 * - { legacyFilter: string } - Migrate legacy filter to expression
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ValidateExpressionResponse | ValidateFilterResponse | MigrateLegacyResponse | ErrorResponse>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);

        return res.status(405).json({
            error: 'Method not allowed',
            details: ['Only POST method is supported for validation']
        } as ErrorResponse);
    }

    try {
        const {body} = req;

        // Validate expression syntax
        if ('expression' in body) {
            const { expression } = body as ValidateExpressionRequest;

            if (typeof expression !== 'string') {
                return res.status(400).json({
                    error: 'Invalid request',
                    details: ['Expression must be a string']
                } as ErrorResponse);
            }

            const validation = validateExpression(expression);

            return res.status(200).json({
                valid: validation.valid,
                errors: validation.errors,
                expression
            } as ValidateExpressionResponse);
        }

        // Validate complete filter
        if ('filter' in body) {
            const { filter } = body as ValidateFilterRequest;

            const errors = getMatchFilterValidationErrors(filter);

            return res.status(200).json({
                valid: errors.length === 0,
                errors,
                filter
            } as ValidateFilterResponse);
        }

        // Migrate legacy filter
        if ('legacyFilter' in body) {
            const { legacyFilter } = body as MigrateLegacyRequest;

            if (typeof legacyFilter !== 'string') {
                return res.status(400).json({
                    error: 'Invalid request',
                    details: ['Legacy filter must be a string']
                } as ErrorResponse);
            }

            const migratedExpression = migrateLegacyFilter(legacyFilter);

            if (migratedExpression) {
                // Validate the migrated expression
                const validation = validateExpression(migratedExpression);

                return res.status(200).json({
                    success: true,
                    originalFilter: legacyFilter,
                    migratedExpression,
                    errors: validation.valid ? undefined : validation.errors
                } as MigrateLegacyResponse);
            }
 
            return res.status(200).json({
                success: false,
                originalFilter: legacyFilter,
                migratedExpression: null,
                errors: ['Unable to migrate legacy filter - pattern not recognized']
            } as MigrateLegacyResponse);
            
        }

        return res.status(400).json({
            error: 'Invalid request',
            details: [
                'Request body must contain one of:',
                '- { expression: string } - to validate expression syntax',
                '- { filter: MatchFilterConfig } - to validate complete filter',
                '- { legacyFilter: string } - to migrate legacy filter'
            ]
        } as ErrorResponse);

    } catch (error) {
        console.error('Error in validation API:', error);

        return res.status(500).json({
            error: 'Internal server error',
            details: [error instanceof Error ? error.message : 'Unknown error']
        } as ErrorResponse);
    }
}