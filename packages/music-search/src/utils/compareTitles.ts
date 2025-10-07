import stringSimilarity from 'string-similarity-js';
import { createSearchString } from './createSearchString';

export function compareTitles(a?: string, b?: string, twoWayContain: boolean = false) {
    if (!a || !b)
        return { match: false, contains: false, similarity: 0 }

    const searchA = createSearchString(a);
    const searchB = createSearchString(b);

    const match = searchA.localeCompare(searchB, "en", { sensitivity: "base", ignorePunctuation: false }) === 0;

    const similarity = stringSimilarity(searchA, searchB);
    let contains = (twoWayContain) ?
        searchA.indexOf(searchB) > -1 || searchB.indexOf(searchA) > -1
        :
        searchA.indexOf(searchB) > -1;

    // To small titles shouldn't use contain
    if (searchA.length < 5 || searchB.length < 5)
        contains = false;


    return { match, contains, similarity };
}
