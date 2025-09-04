import stringSimilarity from 'string-similarity-js';
import { createSearchString } from './createSearchString';

export function compareTitles(a?: string, b?: string, twoWayContain: boolean = false) {
    if (!a || !b)
        return { match: false, contains: false, similarity: 0 }

    const match = a.localeCompare(b, "en", { sensitivity: "base", ignorePunctuation: false }) === 0;

    const similarity = stringSimilarity(a, b);

    // To small titles shouldn't use contain
    let contains = false;
    if (a.length >= 5 && b.length >= 5) {
        contains = (twoWayContain) ?
            createSearchString(a).indexOf(createSearchString(b)) > -1 || createSearchString(b).indexOf(createSearchString(a)) > -1
            :
            createSearchString(a).indexOf(createSearchString(b)) > -1;
    }


    return { match, contains, similarity };
}
