import MusicSearch from "..";

export function filterOutWords(input: string, filtered: boolean = false, cutOffSeperators: boolean = false, removeQuotes = false) {

    // Get the config for word filtering
    const musicSearch = MusicSearch.getInstance();
    const { config } = musicSearch;

    let result = input.toLowerCase();
    const {
        filterOutWords: words = [
            "original mix",
            "radio edit",
            "single edit",
            "alternate mix",
            "remastered",
            "remaster",
            "single version",
            "retail mix",
            "quartet"
        ],
        filterOutQuotes: quotes = [
            "'", '"', "´", "`"
        ],
        cutOffSeparators: separators = [
            "(",
            "[",
            "{",
            "-"
        ]
    } = config;
    if (filtered)
        for (let i = 0; i < words.length; i++)
            result = result.split(words[i]).join("");

    if (removeQuotes)
        for (let i = 0; i < quotes.length; i++)
            result = result.split(quotes[i]).join("");

    // Remove empty brackets
    result = result.split("()").join("");

    if (cutOffSeperators)
        for (let i = 0; i < separators.length; i++)
            if (result.indexOf(separators[i]) > -1)
                result = result.slice(0, Math.max(0, result.lastIndexOf(separators[i])));

    result = result.trim();
    // Remove trailing dashes or starting dashes
    while (result.length > 3 && result.endsWith('-'))
        result = result.slice(0, Math.max(0, result.length - 2)).trim();

    while (result.length > 3 && result.startsWith('-'))
        result = result.slice(0, 1).trim();

    return result;
}
