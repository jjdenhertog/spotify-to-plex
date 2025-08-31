import { TextProcessingConfig } from '@spotify-to-plex/music-search/types/TextProcessingConfig';

/**
 * Validate text processing structure
 */
export const validateTextProcessing = (config: any): config is TextProcessingConfig => {
    return config && 
           typeof config === 'object' && 
           Array.isArray(config.filterOutWords) &&
           Array.isArray(config.filterOutQuotes) &&
           Array.isArray(config.cutOffSeparators) &&
           config.processing &&
           typeof config.processing === 'object' &&
           typeof config.processing.filtered === 'boolean' &&
           typeof config.processing.cutOffSeperators === 'boolean' &&
           typeof config.processing.removeQuotes === 'boolean';
};