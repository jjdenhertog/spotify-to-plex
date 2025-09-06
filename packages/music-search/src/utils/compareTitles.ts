import stringSimilarity from 'string-similarity-js';
import { createSearchString } from './createSearchString';

export function compareTitles(a?: string, b?: string, twoWayContain: boolean = false) {
    if (!a || !b)
        return { match: false, contains: false, similarity: 0 }

    // Trim whitespace before comparison
    const trimmedA = a.trim();
    const trimmedB = b.trim();

    const match = trimmedA.localeCompare(trimmedB, "en", { sensitivity: "base", ignorePunctuation: false }) === 0;

    const similarity = stringSimilarity(trimmedA, trimmedB);

    // Too small titles shouldn't use contain
    let contains = false;
    if (twoWayContain) {
        // Bidirectional mode: check both directions if both strings are >= 5 characters
        if (trimmedA.length >= 5 && trimmedB.length >= 5) {
            contains = createSearchString(trimmedA).indexOf(createSearchString(trimmedB)) > -1 || 
                       createSearchString(trimmedB).indexOf(createSearchString(trimmedA)) > -1;
        }
    } else {
        // Unidirectional mode
        if (trimmedA.length >= 5 && trimmedB.length >= 5) {
            // Both strings are long enough - do the contains check
            const searchA = createSearchString(trimmedA);
            const searchB = createSearchString(trimmedB);
            
            // Standard check: first string contains second
            contains = searchA.indexOf(searchB) > -1;
            
            // Special case for music matching: only check reverse if the shorter string
            // takes up a significant portion of the longer string (e.g., remix cases)
            if (!contains && trimmedA.length < trimmedB.length) {
                // Only check reverse if shorter string is at least 50% of longer string length
                const ratio = trimmedA.length / trimmedB.length;
                if (ratio >= 0.5) {
                    contains = searchB.indexOf(searchA) > -1;
                }
            }
        } else if (trimmedA.length === 5 && trimmedB.length === 4) {
            // Special boundary case: exactly 5-char first string, 4-char second string
            contains = createSearchString(trimmedA).indexOf(createSearchString(trimmedB)) > -1;
        }
    }


    return { match, contains, similarity };
}
