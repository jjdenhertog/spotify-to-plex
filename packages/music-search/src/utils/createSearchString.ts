/* eslint-disable unicorn/prefer-string-replace-all */


export function createSearchString(input: string) {
    // Handle null/undefined input
    if (input == null) {
        return "";
    }

    const result = input
        .toLowerCase()
        // Handle multi-character replacements first to prevent conflicts
        .replace(new RegExp(/æ/g), "ae")
        .replace(new RegExp(/œ/g), "oe")
        .replace(new RegExp(/þ/g), "th")
        // Then handle single-character replacements
        .replace(new RegExp(/[àáâãäå]/g), "a")
        .replace(new RegExp(/ç/g), "c")
        .replace(new RegExp(/ð/g), "d")
        .replace(new RegExp(/[èéêë]/g), "e")
        .replace(new RegExp(/[ìíîï]/g), "i")
        .replace(new RegExp(/ñ/g), "n")
        .replace(new RegExp(/[òóôõö]/g), "o")
        .replace(new RegExp(/[ùúûü]/g), "u")
        .replace(new RegExp(/[ýÿ]/g), "y")
        .trim();

    return result;
}
