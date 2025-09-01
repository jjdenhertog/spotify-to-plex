import { MusicSearchConfig } from "../types/MusicSearchConfig";
import { setState } from "./state/setState";
import { compileFunctionStrings } from "./compileFunctionStrings";
import { parseExpression, migrateLegacyFilter } from "./parseExpression";
import { RuntimeMatchFilter } from "../types/RuntimeMatchFilter";
import { TrackWithMatching } from "../types/TrackWithMatching";

export function setMusicSearchConfig(config: MusicSearchConfig): void {
    const runtimeFilters = compileFilters(config.matchFilters);
    setState({ 
        musicSearchConfig: config,
        runtimeFilters 
    });
}

/**
 * Compile match filters to runtime format, supporting both legacy and new expression formats
 */
function compileFilters(filters: readonly MusicSearchConfig['matchFilters'][0][]): RuntimeMatchFilter[] {
    return filters.map(filter => ({
        reason: filter.reason,
        filter: createFilterFunction(filter)
    }));
}

/**
 * Create filter function supporting both legacy and new formats with feature detection
 */
function createFilterFunction(filter: MusicSearchConfig['matchFilters'][0]): (item: TrackWithMatching) => boolean {
    // Check if using new expression format
    if (filter.expression) {
        return parseExpression(filter.expression);
    }
    
    // Handle legacy format with optional migration
    if (filter.filter) {
        // Try to migrate to new format for better performance
        const migratedExpression = migrateLegacyFilter(filter.filter);

        if (migratedExpression) {
            // Use migrated expression format
            return parseExpression(migratedExpression);
        }
        
        // Fall back to legacy compilation for complex cases
        return compileLegacyFilter(filter.filter);
    }
    
    // Invalid configuration - return never-matching filter
    // eslint-disable-next-line no-console
    console.warn('Invalid match filter configuration: missing both filter and expression', filter);

    return () => false;
}

/**
 * Compile legacy filter function string (fallback for complex cases)
 */
function compileLegacyFilter(filterString: string): (item: TrackWithMatching) => boolean {
    try {
        // Use existing compilation logic as fallback
        const filters = [{ reason: 'temp', filter: filterString }];
        const compiled = compileFunctionStrings(filters);

        return compiled[0]?.filter || (() => false);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to compile legacy filter: ${filterString}`, error);

        return () => false;
    }
}