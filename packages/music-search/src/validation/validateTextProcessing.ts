import { TextProcessingConfig } from '../types/TextProcessingConfig';

/**
 * Validate text processing structure
 */
export const validateTextProcessing = (config: any): config is TextProcessingConfig => {
    return config &&
           typeof config === 'object' &&
           Array.isArray(config.filterOutWords) &&
           Array.isArray(config.filterOutQuotes) &&
           Array.isArray(config.cutOffSeparators)
};