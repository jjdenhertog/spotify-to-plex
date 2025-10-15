import { compareTitles } from '../music/compareTitles';
import { removeFeaturing } from '../music/removeFeaturing';
import { createSearchString } from '../music/createSearchString';

export function validateMusicBrainzMatch(artistName: string, albumName: string, mbArtistName: string, mbAlbumName: string, threshold: number = 0.8) {
    const cleanAlbumName = removeFeaturing(createSearchString(albumName));
    const cleanMbAlbumName = removeFeaturing(createSearchString(mbAlbumName));

    const expected = `${createSearchString(artistName)} ${cleanAlbumName}`;
    const received = `${createSearchString(mbArtistName)} ${cleanMbAlbumName}`;

    const { similarity } = compareTitles(expected, received);

    return similarity >= threshold;
}
