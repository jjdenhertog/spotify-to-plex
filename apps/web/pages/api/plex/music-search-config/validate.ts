import { NextApiRequest, NextApiResponse } from 'next';

// Types for validation
interface MatchFilter {
    id: string;
    name: string;
    enabled: boolean;
    artistSimilarity?: number;
    titleSimilarity?: number;
    artistWithTitleSimilarity?: number;
    useContains?: boolean;
    useArtistMatch?: boolean;
    reason: string;
}

interface TextProcessingConfig {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[];
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;
        removeQuotes: boolean;
    };
}

interface SearchApproachConfig {
    name: string;
    filtered: boolean;
    cutOffSeperators: boolean; // Note: preserving typo from original
    removeQuotes: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MusicSearchConfig {
    matchFilters: MatchFilter[];
    textProcessing: TextProcessingConfig;
    searchApproaches: {
        plex: SearchApproachConfig[];
        tidal: SearchApproachConfig[];
    };
}

interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

// Comprehensive validation function
const validateConfiguration = (config: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Basic structure validation
    if (!config || typeof config !== 'object') {
        errors.push({
            field: 'root',
            message: 'Configuration must be an object'
        });
        return errors;
    }

    // Validate matchFilters array
    if (!Array.isArray(config.matchFilters)) {
        errors.push({
            field: 'matchFilters',
            message: 'matchFilters must be an array'
        });
    } else {
        config.matchFilters.forEach((filter: any, index: number) => {
            const prefix = `matchFilters[${index}]`;

            if (!filter.id || typeof filter.id !== 'string') {
                errors.push({
                    field: `${prefix}.id`,
                    message: 'Filter ID is required and must be a string',
                    value: filter.id
                });
            }

            if (!filter.name || typeof filter.name !== 'string') {
                errors.push({
                    field: `${prefix}.name`,
                    message: 'Filter name is required and must be a string',
                    value: filter.name
                });
            }

            if (typeof filter.enabled !== 'boolean') {
                errors.push({
                    field: `${prefix}.enabled`,
                    message: 'Filter enabled must be a boolean',
                    value: filter.enabled
                });
            }

            if (!filter.reason || typeof filter.reason !== 'string') {
                errors.push({
                    field: `${prefix}.reason`,
                    message: 'Filter reason is required and must be a string',
                    value: filter.reason
                });
            }

            // Validate similarity values if present
            ['artistSimilarity', 'titleSimilarity', 'artistWithTitleSimilarity'].forEach(field => {
                if (filter[field] !== undefined) {
                    const value = filter[field];
                    if (typeof value !== 'number' || value < 0 || value > 1) {
                        errors.push({
                            field: `${prefix}.${field}`,
                            message: `${field} must be a number between 0 and 1`,
                            value
                        });
                    }
                }
            });

            // Validate boolean flags if present
            ['useContains', 'useArtistMatch'].forEach(field => {
                if (filter[field] !== undefined && typeof filter[field] !== 'boolean') {
                    errors.push({
                        field: `${prefix}.${field}`,
                        message: `${field} must be a boolean`,
                        value: filter[field]
                    });
                }
            });
        });
    }

    // Validate textProcessing object
    if (!config.textProcessing || typeof config.textProcessing !== 'object') {
        errors.push({
            field: 'textProcessing',
            message: 'textProcessing must be an object'
        });
    } else {
        const textProcessing = config.textProcessing;

        // Validate arrays
        ['filterOutWords', 'filterOutQuotes', 'cutOffSeparators'].forEach(field => {
            if (!Array.isArray(textProcessing[field])) {
                errors.push({
                    field: `textProcessing.${field}`,
                    message: `${field} must be an array`,
                    value: textProcessing[field]
                });
            } else {
                // Validate array elements are strings
                textProcessing[field].forEach((item: any, index: number) => {
                    if (typeof item !== 'string') {
                        errors.push({
                            field: `textProcessing.${field}[${index}]`,
                            message: `All items in ${field} must be strings`,
                            value: item
                        });
                    }
                });
            }
        });

        // Validate boolean flags
        ['removeQuotes', 'cutOffSeparators'].forEach(field => {
            if (typeof textProcessing[field] !== 'boolean') {
                errors.push({
                    field: `textProcessing.${field}`,
                    message: `${field} must be a boolean`,
                    value: textProcessing[field]
                });
            }
        });
    }

    // Validate searchApproaches object
    if (!config.searchApproaches || typeof config.searchApproaches !== 'object') {
        errors.push({
            field: 'searchApproaches',
            message: 'searchApproaches must be an object'
        });
    } else {
        ['plex', 'tidal'].forEach(platform => {
            if (!Array.isArray(config.searchApproaches[platform])) {
                errors.push({
                    field: `searchApproaches.${platform}`,
                    message: `searchApproaches.${platform} must be an array`,
                    value: config.searchApproaches[platform]
                });
            } else {
                config.searchApproaches[platform].forEach((approach: any, index: number) => {
                    const prefix = `searchApproaches.${platform}[${index}]`;

                    if (!approach.name || typeof approach.name !== 'string') {
                        errors.push({
                            field: `${prefix}.name`,
                            message: 'Approach name is required and must be a string',
                            value: approach.name
                        });
                    }

                    // Validate boolean flags
                    ['filtered', 'cutOffSeperators', 'removeQuotes'].forEach(field => {
                        if (typeof approach[field] !== 'boolean') {
                            errors.push({
                                field: `${prefix}.${field}`,
                                message: `${field} must be a boolean`,
                                value: approach[field]
                            });
                        }
                    });
                });
            }
        });
    }

    // Business logic validations
    if (config.matchFilters && Array.isArray(config.matchFilters)) {
        // Check for duplicate IDs
        const ids = config.matchFilters.map((f: any) => f.id).filter((id: any) => typeof id === 'string');
        const duplicateIds = ids.filter((id: string, index: number) => ids.indexOf(id) !== index);
        
        if (duplicateIds.length > 0) {
            errors.push({
                field: 'matchFilters',
                message: `Duplicate filter IDs found: ${duplicateIds.join(', ')}`
            });
        }

        // Warn about filters with no matching criteria
        config.matchFilters.forEach((filter: any, index: number) => {
            const hasMatchingCriteria = filter.artistSimilarity !== undefined || 
                                      filter.titleSimilarity !== undefined || 
                                      filter.artistWithTitleSimilarity !== undefined;
                                      
            if (!hasMatchingCriteria) {
                errors.push({
                    field: `matchFilters[${index}]`,
                    message: 'Filter must have at least one matching criterion (artistSimilarity, titleSimilarity, or artistWithTitleSimilarity)',
                    value: filter
                });
            }
        });
    }

    return errors;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', ['POST']);
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const config = req.body;
        const validationErrors = validateConfiguration(config);

        if (validationErrors.length === 0) {
            return res.status(200).json({
                valid: true,
                message: 'Configuration is valid'
            });
        } else {
            return res.status(400).json({
                valid: false,
                errors: validationErrors,
                message: `Configuration has ${validationErrors.length} validation error(s)`
            });
        }

    } catch (error) {
        console.error('Error validating music search config:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}