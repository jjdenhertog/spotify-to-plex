/* eslint-disable @typescript-eslint/prefer-destructuring */
/**
 * Pattern: Hierarchical Folder Structure
 *
 * Extracts metadata from /Artist/Album/Title folder structure.
 * This is a very common organization pattern for music libraries.
 *
 * Examples:
 *   /Music/Pink Floyd/The Wall/01 - In The Flesh.mp3
 *   /Downloads/Radiohead/OK Computer/Paranoid Android.flac
 *   /Artist Name/Album Name/Track Title.mp3
 */

import type { ExtractionPattern, ExtractionResult } from '../types';
import {
    getPathParts,
    getFilename,
    getParentFolder,
    getGrandparentFolder,
    cleanFilename,
    splitArtistTitle,
    extractTitleFromFilename,
    validateMetadata,
    normalizeText,
    isGenericFolderName
} from '../helpers';

function extract(filePath: string): ExtractionResult {
    const parts = getPathParts(filePath);

    if (parts.length < 3) 
        return { success: false, error: 'Path too short for hierarchical pattern' };

    const filename = getFilename(filePath);
    const albumFolder = getParentFolder(filePath);
    const artistFolder = getGrandparentFolder(filePath);

    if (isGenericFolderName(artistFolder)) 
        return { success: false, error: 'Artist folder is generic' };

    if (isGenericFolderName(albumFolder)) 
        return { success: false, error: 'Album folder is generic' };

    const artist = normalizeText(artistFolder);
    const album = normalizeText(albumFolder);
    const cleanedFilename = cleanFilename(filename);
    const filenameParsed = splitArtistTitle(cleanedFilename);
    const title = filenameParsed?.title ?? extractTitleFromFilename(cleanedFilename);

    if (!validateMetadata(artist, title)) 
        return { success: false, error: 'Invalid artist or title' };

    return {
        success: true,
        metadata: {
            artist,
            title,
            album,
            pattern: 'hierarchical-folder',
            confidence: 0.95
        }
    };
}

export const hierarchicalFolderPattern: ExtractionPattern = {
    name: 'hierarchical-folder',
    description: 'Extracts from /Artist/Album/Title structure',
    extract
};
