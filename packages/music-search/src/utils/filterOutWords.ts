import { TextProcessingConfig } from "../types/TextProcessingConfig";

export function filterOutWords(input: string, textProcessing: TextProcessingConfig, filtered: boolean = false, cutOffSeperators: boolean = false, removeQuotes = false) {

    let result = input.toLowerCase();
    const {
        filterOutWords: words,
        filterOutQuotes: quotes,
        cutOffSeparators: separators
    } = textProcessing;
    if (filtered)
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word) {
                result = result.split(word).join("");
            }
        }

    if (removeQuotes)
        for (let i = 0; i < quotes.length; i++) {
            const quote = quotes[i];
            if (quote) {
                result = result.split(quote).join("");
            }
        }

    // Remove empty brackets
    result = result.split("()").join("");

    if (cutOffSeperators)
        for (let i = 0; i < separators.length; i++) {
            const separator = separators[i];
            if (separator && result.indexOf(separator) > 4) {
                // Use indexOf for separators containing commas to cut at first occurrence, lastIndexOf for others
                const cutIndex = separator.includes(",") ? result.indexOf(separator) : result.lastIndexOf(separator);
                result = result.slice(0, Math.max(0, cutIndex));
            }
        }

    result = result.trim();
    // Remove trailing dashes or starting dashes
    while (result.length > 3 && result.endsWith('-'))
        result = result.slice(0, Math.max(0, result.length - 2)).trim();

    while (result.length > 3 && result.startsWith('-'))
        result = result.slice(0, 1).trim();

    return result;
}
