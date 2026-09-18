import { MATCH_FILTER_FIELDS } from './matchFilterFields';

// The alternation used by every expression regex. Field names are alphanumeric,
// so they need no escaping
export function matchFilterFieldPattern() {
    return `(${MATCH_FILTER_FIELDS.join('|')})`;
}
