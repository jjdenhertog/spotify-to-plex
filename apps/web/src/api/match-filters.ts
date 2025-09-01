import { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';
import {
    MatchFiltersApiClient,
    GetMatchFiltersParams,
    GetMatchFiltersResponse,
    UpdateMatchFiltersRequest,
    UpdateMatchFiltersSuccessResponse,
    MatchFiltersErrorResponse,
    ValidateExpressionResponse,
    ValidateFilterResponse,
    ValidationErrorResponse
} from '../types/api/match-filters';

/**
 * API client for match filters endpoints
 */
class MatchFiltersClient implements MatchFiltersApiClient {
    private readonly baseUrl = '/api/plex/music-search-config';

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
    public async getMatchFilters(params?: GetMatchFiltersParams): Promise<GetMatchFiltersResponse> {
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
    public async updateMatchFilters(filters: UpdateMatchFiltersRequest): Promise<UpdateMatchFiltersSuccessResponse> {
        return this.request<UpdateMatchFiltersSuccessResponse>(`${this.baseUrl}/match-filters`, {
            method: 'POST',
            body: JSON.stringify(filters)
        });
    }


    /**
     * Validate expression syntax
     */
    public async validateExpression(expression: string): Promise<ValidateExpressionResponse> {
        return this.request<ValidateExpressionResponse>(`${this.baseUrl}/validate`, {
            method: 'POST',
            body: JSON.stringify({ expression })
        });
    }

    /**
     * Validate complete filter object
     */
    public async validateFilter(filter: MatchFilterConfig): Promise<ValidateFilterResponse> {
        return this.request<ValidateFilterResponse>(`${this.baseUrl}/validate`, {
            method: 'POST',
            body: JSON.stringify({ filter })
        });
    }

}

// Export singleton instance
export const matchFiltersApi = new MatchFiltersClient();

/**
 * React Hook for match filters API operations
 */
import { useState, useCallback } from 'react';

export type UseMatchFiltersApi = {
    // State
    filters: MatchFilterConfig[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    loadFilters: () => Promise<void>;
    saveFilters: (filters: MatchFilterConfig[]) => Promise<void>;
    validateExpression: (expression: string) => Promise<{ valid: boolean; errors: string[] }>;
    validateFilter: (filter: MatchFilterConfig) => Promise<{ valid: boolean; errors: string[] }>;
    
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


    return {
        filters,
        isLoading,
        error,
        loadFilters,
        saveFilters,
        validateExpression,
        validateFilter,
        clearError
    };
}
