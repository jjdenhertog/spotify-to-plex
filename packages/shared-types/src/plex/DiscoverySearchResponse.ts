import { DiscoverySearchResultGroup } from './DiscoverySearchResultGroup';

export type DiscoverySearchResponse = {
    MediaContainer: {
        size: number
        SearchResults: DiscoverySearchResultGroup[],
    }
}