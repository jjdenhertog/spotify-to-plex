import { MusicSearchConfig } from "../types/MusicSearchConfig";
import { RuntimeMatchFilter } from "../types/RuntimeMatchFilter";
import { TrackWithMatching } from "../types/TrackWithMatching";

function createFilterFunction(filterString: string): (item: TrackWithMatching) => boolean {
    try {
        // Create function from string - safer than eval for trusted configuration
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        return new Function('item', `return ${filterString.replace(/^\(item\)\s*=>\s*/, '')};`) as (item: TrackWithMatching) => boolean;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to create filter function from: ${filterString}`, error);

        // Return a filter that never matches on error
        return () => false;
    }
}

export function compileFunctionStrings(filters: readonly MusicSearchConfig['matchFilters'][0][]): RuntimeMatchFilter[] {
    return filters.map(filter => ({
        reason: filter.reason,
        filter: createFilterFunction(filter.filter)
    }));
}