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

export function convertTextProcessingUIToJson(ui: TextProcessingConfig): TextProcessingConfig {
    return ui;
}