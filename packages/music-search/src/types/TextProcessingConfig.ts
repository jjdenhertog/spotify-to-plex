/**
 * Text processing configuration - simple structure
 */
export type TextProcessingConfig = {
  readonly filterOutWords: readonly string[];
  readonly filterOutQuotes: readonly string[];
  readonly cutOffSeparators: readonly string[];
  readonly processing: {
    readonly filtered: boolean;
    readonly cutOffSeperators: boolean; // Preserves typo from original code
    readonly removeQuotes: boolean;
  };
}