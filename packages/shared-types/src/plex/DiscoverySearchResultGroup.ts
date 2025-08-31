import { DiscoverySearchResult } from './DiscoverySearchResult';

export type DiscoverySearchResultGroup = {
    id: string,
    title: string,
    size: number,
    SearchResult?: DiscoverySearchResult[]
}