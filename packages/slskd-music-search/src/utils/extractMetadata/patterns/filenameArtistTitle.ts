/* eslint-disable @typescript-eslint/prefer-destructuring */
/**
 * Pattern: Filename Artist-Title
 *
 * Extracts "Artist - Title" directly from filename.
 * This is the most common and reliable pattern for Soulseek files.
 *
 * Album is optionally extracted from the parent folder.
 *
 * Examples:
 *   /path/to/Artist - Title.mp3
 *   /path/to/01 - Artist - Title.flac
 *   /Music/Album Name/Artist - Song Name.mp3
 *   /Pink Floyd - The Wall/Pink Floyd - In The Flesh.mp3
 */
import type { ExtractionPattern, ExtractionResult } from '../types';
import {
    getFilename,
    getParentFolder,
    cleanFilename,
    splitArtistTitle,
    parseArtistAlbumFolder,
    validateMetadata,
    normalizeText,
    isGenericFolderName
} from '../helpers';

function extract(filePath: string): ExtractionResult {
    const filename = getFilename(filePath);

    if (!filename) 
        return { success: false, error: 'Missing filename' };

    // Clean and parse filename
    const cleanedFilename = cleanFilename(filename);
    const parsed = splitArtistTitle(cleanedFilename);

    if (!parsed) 
        return { success: false, error: 'Filename does not match Artist - Title pattern' };

    const { artist, title } = parsed;

    // Try to extract album from parent folder
    let album = '';
    const folderName = getParentFolder(filePath);

    if (!isGenericFolderName(folderName)) {
        const folderParsed = parseArtistAlbumFolder(folderName);
        if (folderParsed) {
            if (folderParsed.artist.toLowerCase() === artist.toLowerCase()) {
                album = folderParsed.album;
            } else {
                album = normalizeText(folderName);
            }
        } else {
            album = normalizeText(folderName);
        }
    }

    if (!validateMetadata(artist, title)) 
        return { success: false, error: 'Invalid artist or title' };

    return {
        success: true,
        metadata: {
            artist,
            title,
            album,
            pattern: 'filename-artist-title'
        }
    };
}

export const filenameArtistTitlePattern: ExtractionPattern = {
    name: 'filename-artist-title',
    description: 'Extracts Artist - Title from filename',
    extract
};
