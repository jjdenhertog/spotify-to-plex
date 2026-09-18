
// Local files keep their full spotify:local: uri as id - there is no short form
export function extractTrackId(trackId?: string) {
    if (!trackId)
        return null;

    if (trackId.startsWith('spotify:track:'))
        return trackId.replace('spotify:track:', '');

    return trackId;
}
