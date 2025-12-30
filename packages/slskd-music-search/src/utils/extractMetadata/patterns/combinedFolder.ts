/* eslint-disable @typescript-eslint/prefer-destructuring */
/**
 * Pattern: Combined Artist-Album Folder
 *
 * Extracts metadata from /Artist - Album/Title folder structure.
 * Common alternative to hierarchical structure.
 *
 * Examples:
 *   /Music/Pink Floyd - The Wall/01 - In The Flesh.mp3
 *   /Downloads/Radiohead - OK Computer/Paranoid Android.flac
 *   /Artist Name - Album Name/Track Title.mp3
 */
import type { ExtractionPattern, ExtractionResult } from '../types';
import {
    getPathParts,
    getFilename,
    getParentFolder,
    cleanFilename,
    splitArtistTitle,
    parseArtistAlbumFolder,
    extractTitleFromFilename,
    validateMetadata
} from '../helpers';

function extract(filePath: string): ExtractionResult {
    const parts = getPathParts(filePath);

    if (parts.length < 2) 
        return { success: false, error: 'Path too short' };

    const filename = getFilename(filePath);
    const folderName = getParentFolder(filePath);
    const folderParsed = parseArtistAlbumFolder(folderName);

    if (!folderParsed) 
        return { success: false, error: 'Folder does not match Artist - Album pattern' };

    const { artist, album } = folderParsed;
    const cleanedFilename = cleanFilename(filename);
    const filenameParsed = splitArtistTitle(cleanedFilename);
    let title: string;

    if (filenameParsed) {
        if (filenameParsed.artist.toLowerCase() === artist.toLowerCase()) {
            title = filenameParsed.title;
        } else {
            title = extractTitleFromFilename(cleanedFilename);
        }
    } else {
        title = extractTitleFromFilename(cleanedFilename);
    }

    if (!validateMetadata(artist, title)) 
        return { success: false, error: 'Invalid artist or title' };

    return {
        success: true,
        metadata: {
            artist,
            title,
            album,
            pattern: 'combined-folder',
            confidence: 0.9
        }
    };
}

export const combinedFolderPattern: ExtractionPattern = {
    name: 'combined-folder',
    description: 'Extracts from /Artist - Album/Title structure',
    extract
};
