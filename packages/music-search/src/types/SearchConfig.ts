import { MatchFilter } from "./MatchFilter";


export type SearchConfig = {
    filterOutWords?: string[];
    filterOutQuotes?: string[];
    cutOffSeparators?: string[];
    matchFilters?: MatchFilter[];
};
