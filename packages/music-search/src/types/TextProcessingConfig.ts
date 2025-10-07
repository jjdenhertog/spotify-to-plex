/**
 * Text processing configuration - simple structure
 */
export type TextProcessingConfig = {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[]
}