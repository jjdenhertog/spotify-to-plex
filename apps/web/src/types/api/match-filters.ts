/* eslint-disable custom/no-export-only-files */
import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';

/**
 * Match Filters API Types
 * For /api/plex/music-search-config/match-filters
 */

// GET Requests
export type GetMatchFiltersParams = {
    migrate?: boolean; // Query param to trigger migration during GET
};

export type GetMatchFiltersResponse = MatchFilterConfig[];

// POST/PUT Requests
export type UpdateMatchFiltersRequest = MatchFilterConfig[];

export type UpdateMatchFiltersSuccessResponse = {
    success: true;
    message: string;
    filters: MatchFilterConfig[];
};

// Error Responses
export type MatchFiltersErrorResponse = {
    error: string;
    details?: string[];
    validationErrors?: string[];
};

/**
 * Validation API Types
 * For /api/plex/music-search-config/validate
 */

// Request Types
export type ValidateExpressionRequest = {
    expression: string;
};

export type ValidateFilterRequest = {
    filter: MatchFilterConfig;
};

export type MigrateLegacyFilterRequest = {
    legacyFilter: string;
};

export type ValidationRequest = 
    | ValidateExpressionRequest 
    | ValidateFilterRequest 
    | MigrateLegacyFilterRequest;

// Response Types
export type ValidateExpressionResponse = {
    valid: boolean;
    errors: string[];
    expression: string;
};

export type ValidateFilterResponse = {
    valid: boolean;
    errors: string[];
    filter: MatchFilterConfig;
};

export type MigrateLegacyFilterResponse = {
    success: boolean;
    originalFilter: string;
    migratedExpression: string | null;
    errors?: string[];
};

export type ValidationResponse = 
    | ValidateExpressionResponse 
    | ValidateFilterResponse 
    | MigrateLegacyFilterResponse;

export type ValidationErrorResponse = {
    error: string;
    details?: string[];
};

/**
 * Client API Functions Types
 */

export type MatchFiltersApiClient = {
    // Get current match filters
    getMatchFilters: (params?: GetMatchFiltersParams) => Promise<GetMatchFiltersResponse>;
    
    // Update match filters
    updateMatchFilters: (filters: UpdateMatchFiltersRequest) => Promise<UpdateMatchFiltersSuccessResponse>;
    
    // Validate expression syntax
    validateExpression: (expression: string) => Promise<ValidateExpressionResponse>;
    
    // Validate complete filter object
    validateFilter: (filter: MatchFilterConfig) => Promise<ValidateFilterResponse>;
}

/**
 * Expression Field Types
 */
export type ExpressionField = 'artist' | 'title' | 'album' | 'artistWithTitle' | 'artistInTitle';

export type ExpressionOperation = 'match' | 'contains' | 'similarity';

export type ExpressionOperator = 'AND' | 'OR';

export type ExpressionCondition = {
    field: ExpressionField;
    operation: ExpressionOperation;
    threshold?: number; // For similarity operations
};

export type ParsedExpression = {
    conditions: ExpressionCondition[];
    operators: ExpressionOperator[];
};

/**
 * UI State Types
 */
export type MatchFilterEditorState = {
    filters: MatchFilterConfig[];
    isLoading: boolean;
    error: string | null;
    validationErrors: Record<number, string[]>; // Index-based validation errors
    isDirty: boolean;
    migrationStatus?: {
        inProgress: boolean;
        results?: {
            count: number;
            details: string[];
        };
    };
}

export type ExpressionBuilderState = {
    conditions: ExpressionCondition[];
    isValid: boolean;
    errors: string[];
    previewExpression: string;
};

/**
 * Utility Types
 */
export type FilterFormat = 'legacy' | 'expression' | 'mixed';

export type FilterFormatInfo = {
    format: FilterFormat;
    canMigrate: boolean;
    migrationRequired: boolean;
    legacyCount: number;
    expressionCount: number;
    mixedCount: number;
}