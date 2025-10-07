import { MusicSearchConfig } from "../types/MusicSearchConfig";
import { setState } from "./state/setState";
import { parseExpression } from "./parseExpression";
import { RuntimeMatchFilter } from "../types/RuntimeMatchFilter";
import { Track } from "../types/Track";

export function setMusicSearchConfig(config: MusicSearchConfig): void {
    const runtimeFilters = compileFilters(config.matchFilters);
    setState({
        musicSearchConfig: config,
        runtimeFilters
    });
}

/**
 * Compile match filters to runtime format using expression-based filtering
 */
function compileFilters(filters: MusicSearchConfig['matchFilters'][0][]): RuntimeMatchFilter[] {
    return filters.map((filter, index) => ({
        reason: `Filter ${index + 1}`, // Generate simple reason since we only have expressions
        filter: createFilterFunction(filter)
    }));
}

/**
 * Create filter function from expression string
 */
function createFilterFunction(filterExpression: MusicSearchConfig['matchFilters'][0]): (item: Track) => boolean {
    // Since MatchFilterConfig is now just a string, use it directly
    if (typeof filterExpression === 'string') {
        return parseExpression(filterExpression);
    }

    // Invalid configuration - return never-matching filter
    // eslint-disable-next-line no-console
    console.warn('Invalid match filter configuration: expected string expression', filterExpression);

    return () => false;
}