
// The single source of truth for which fields a match filter may name.
// Everything that validates, parses or offers a field derives from this -
// the list used to live in ten places and adding one meant finding them all
export const MATCH_FILTER_FIELDS = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle', 'version', 'duration'] as const;
