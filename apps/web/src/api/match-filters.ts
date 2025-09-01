import { MatchFilterConfig } from '@spotify-to-plex/music-search/types/MatchFilterConfig';
import {
    MatchFiltersApiClient,
    GetMatchFiltersParams,
    GetMatchFiltersResponse,
    UpdateMatchFiltersRequest,
    UpdateMatchFiltersSuccessResponse,
    MatchFiltersErrorResponse,
    ValidateExpressionResponse,
    ValidateFilterResponse,
    MigrateLegacyFilterResponse,
    ValidationErrorResponse
} from '../types/api/match-filters';

/**
 * API client for match filters endpoints
 */
class MatchFiltersClient implements MatchFiltersApiClient {
    private baseUrl = '/api/plex/music-search-config';

    /**
     * Make HTTP request with error handling
     */
    private async request<T>(
        url: string, 
        options: RequestInit = {}
    ): Promise<T> {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            const error = data as MatchFiltersErrorResponse | ValidationErrorResponse;
            const errorMessage = error.error || `HTTP ${response.status}`;
            const errorDetails = 'details' in error ? error.details?.join(', ') : undefined;
            const validationErrors = 'validationErrors' in error ? error.validationErrors?.join(', ') : undefined;
            
            const fullMessage = [errorMessage, errorDetails, validationErrors]
                .filter(Boolean)
                .join(': ');
                
            throw new Error(fullMessage);
        }

        return data;
    }

    /**
     * Get current match filters
     */
    async getMatchFilters(params?: GetMatchFiltersParams): Promise<GetMatchFiltersResponse> {
        const queryParams = new URLSearchParams();
        
        if (params?.migrate) {
            queryParams.set('migrate', 'true');
        }
        
        const url = `${this.baseUrl}/match-filters${queryParams.toString() ? `?${queryParams}` : ''}`;
        
        return this.request<GetMatchFiltersResponse>(url, {
            method: 'GET'
        });
    }

    /**
     * Update match filters
     */
    async updateMatchFilters(filters: UpdateMatchFiltersRequest): Promise<UpdateMatchFiltersSuccessResponse> {
        return this.request<UpdateMatchFiltersSuccessResponse>(`${this.baseUrl}/match-filters`, {
            method: 'POST',
            body: JSON.stringify(filters)
        });
    }

    /**
     * Migrate legacy filters to expression format
     */
    async migrateFilters(): Promise<UpdateMatchFiltersSuccessResponse> {
        return this.request<UpdateMatchFiltersSuccessResponse>(`${this.baseUrl}/match-filters`, {
            method: 'PUT'
        });
    }

    /**
     * Validate expression syntax
     */
    async validateExpression(expression: string): Promise<ValidateExpressionResponse> {
        return this.request<ValidateExpressionResponse>(`${this.baseUrl}/validate`, {
            method: 'POST',
            body: JSON.stringify({ expression })
        });
    }

    /**
     * Validate complete filter object
     */
    async validateFilter(filter: MatchFilterConfig): Promise<ValidateFilterResponse> {
        return this.request<ValidateFilterResponse>(`${this.baseUrl}/validate`, {
            method: 'POST',
            body: JSON.stringify({ filter })
        });
    }

    /**
     * Migrate legacy filter string to expression
     */
    async migrateLegacyFilter(legacyFilter: string): Promise<MigrateLegacyFilterResponse> {
        return this.request<MigrateLegacyFilterResponse>(`${this.baseUrl}/validate`, {
            method: 'POST',
            body: JSON.stringify({ legacyFilter })
        });
    }
}

// Export singleton instance
export const matchFiltersApi = new MatchFiltersClient();

/**
 * React Hook for match filters API operations
 */
import { useState, useCallback } from 'react';

export interface UseMatchFiltersApi {
    // State
    filters: MatchFilterConfig[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    loadFilters: () => Promise<void>;
    saveFilters: (filters: MatchFilterConfig[]) => Promise<void>;
    migrateFilters: () => Promise<void>;
    validateExpression: (expression: string) => Promise<{ valid: boolean; errors: string[] }>;
    validateFilter: (filter: MatchFilterConfig) => Promise<{ valid: boolean; errors: string[] }>;
    migrateLegacyFilter: (legacyFilter: string) => Promise<{ success: boolean; expression: string | null; errors?: string[] }>;
    
    // Reset state
    clearError: () => void;
}

export function useMatchFiltersApi(): UseMatchFiltersApi {
    const [filters, setFilters] = useState<MatchFilterConfig[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const loadFilters = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await matchFiltersApi.getMatchFilters();
            setFilters(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load filters');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveFilters = useCallback(async (newFilters: MatchFilterConfig[]) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await matchFiltersApi.updateMatchFilters(newFilters);
            setFilters(result.filters);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save filters');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const migrateFilters = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await matchFiltersApi.migrateFilters();
            setFilters(result.filters);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to migrate filters');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const validateExpression = useCallback(async (expression: string) => {
        try {
            const result = await matchFiltersApi.validateExpression(expression);
            return { valid: result.valid, errors: result.errors };
        } catch (err) {
            return { 
                valid: false, 
                errors: [err instanceof Error ? err.message : 'Validation failed'] 
            };
        }
    }, []);

    const validateFilter = useCallback(async (filter: MatchFilterConfig) => {
        try {
            const result = await matchFiltersApi.validateFilter(filter);
            return { valid: result.valid, errors: result.errors };
        } catch (err) {
            return { 
                valid: false, 
                errors: [err instanceof Error ? err.message : 'Validation failed'] 
            };
        }
    }, []);

    const migrateLegacyFilter = useCallback(async (legacyFilter: string) => {
        try {
            const result = await matchFiltersApi.migrateLegacyFilter(legacyFilter);
            return { 
                success: result.success, 
                expression: result.migratedExpression,
                errors: result.errors 
            };
        } catch (err) {
            return { 
                success: false, 
                expression: null,
                errors: [err instanceof Error ? err.message : 'Migration failed'] 
            };
        }
    }, []);

    return {
        filters,
        isLoading,
        error,
        loadFilters,
        saveFilters,
        migrateFilters,
        validateExpression,
        validateFilter,
        migrateLegacyFilter,
        clearError
    };
}

/**
 * Utility functions for working with match filters
 */
export const matchFilterUtils = {
    /**
     * Check if a filter uses the new expression format
     */
    isExpressionFilter(filter: MatchFilterConfig): boolean {
        return Boolean(filter.expression);
    },

    /**
     * Check if a filter uses the legacy format
     */
    isLegacyFilter(filter: MatchFilterConfig): boolean {
        return Boolean(filter.filter && !filter.expression);
    },

    /**
     * Check if a filter has both formats (during migration)
     */
    isMixedFilter(filter: MatchFilterConfig): boolean {
        return Boolean(filter.filter && filter.expression);
    },

    /**
     * Get format information for an array of filters
     */
    getFormatInfo(filters: MatchFilterConfig[]) {
        const legacyCount = filters.filter(this.isLegacyFilter).length;
        const expressionCount = filters.filter(f => this.isExpressionFilter(f) && !this.isMixedFilter(f)).length;
        const mixedCount = filters.filter(this.isMixedFilter).length;
        
        let format: 'legacy' | 'expression' | 'mixed';
        if (legacyCount === filters.length) {
            format = 'legacy';
        } else if (expressionCount + mixedCount === filters.length) {
            format = 'expression';
        } else {
            format = 'mixed';
        }
        
        return {
            format,
            canMigrate: legacyCount > 0,
            migrationRequired: format === 'legacy',
            legacyCount,
            expressionCount,
            mixedCount
        };
    },

    /**
     * Create a new expression-based filter
     */
    createExpressionFilter(reason: string, expression: string): MatchFilterConfig {
        return { reason, expression };
    },

    /**
     * Create a new legacy filter
     */
    createLegacyFilter(reason: string, filter: string): MatchFilterConfig {
        return { reason, filter };
    }
};