type TextProcessingConfig = {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[];
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;
        removeQuotes: boolean;
    };
};

export function convertTextProcessingJsonToUI(json: TextProcessingConfig): TextProcessingConfig {
    return json;
}