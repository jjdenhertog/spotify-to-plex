import { getCurrentMusicSearchConfig } from "../functions/getMusicSearchConfig";

export function filterOutWords(input: string, filtered: boolean = false, cutOffSeperators: boolean = false, removeQuotes = false) {

    // Get the config for word filtering - now uses the new configuration system
    const musicSearchConfig = getCurrentMusicSearchConfig();
    const {textProcessing} = musicSearchConfig;

    let result = input.toLowerCase();
    const {
        filterOutWords: words,
        filterOutQuotes: quotes,
        cutOffSeparators: separators
    } = textProcessing;
    
    // Store the result after word filtering to detect if we should preserve spaces
    let resultAfterWordFiltering = result;
    
    if (filtered)
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word) {
                result = result.split(word).join("");
            }
        }
    
    resultAfterWordFiltering = result;

    if (removeQuotes)
        for (let i = 0; i < quotes.length; i++) {
            const quote = quotes[i];
            if (quote) {
                result = result.split(quote).join("");
            }
        }

    // Remove empty brackets
    result = result.split("()").join("");

    // Track if we applied separator cutting
    let hasSeparatorCutting = false;
    
    if (cutOffSeperators)
        for (let i = 0; i < separators.length; i++) {
            const separator = separators[i];
            if (separator && result.indexOf(separator) > -1) {
                result = result.slice(0, Math.max(0, result.lastIndexOf(separator)));
                hasSeparatorCutting = true;
            }
        }

    // Determine if we should preserve trailing spaces from word filtering
    // We preserve them ONLY if:
    // 1. We did word filtering AND
    // 2. No other operations happened after word filtering that would justify trimming AND 
    // 3. The result after word filtering had trailing spaces from word removal AND
    // 4. The result isn't only whitespace (edge case)
    const shouldPreserveTrailingSpaces = (
        filtered && 
        result === resultAfterWordFiltering && // No operations after word filtering changed the result
        resultAfterWordFiltering.endsWith(' ') &&
        result.trim() !== '' && // Don't preserve spaces if result is only whitespace
        !cutOffSeperators && // No separator cutting
        !removeQuotes // No quote removal
    );
    
    if (!shouldPreserveTrailingSpaces) {
        result = result.trim();
    }
    
    // Remove trailing dashes or starting dashes, but be more careful after separator cutting
    // If we just did separator cutting that left trailing dashes, be less aggressive
    if (!hasSeparatorCutting) {
        while (result.length > 3 && result.endsWith('-'))
            result = result.slice(0, Math.max(0, result.length - 2)).trim();
    }

    while (result.length > 3 && result.startsWith('-'))
        result = result.slice(1).trim();

    return result;
}
