export type MusicBrainzReleaseResponse = {
    id: string;
    title: string;
    date: string;
    country: string;
    barcode: string | null;
    disambiguation: string;
    status: string;
    'status-id': string;
    'release-group': {
        id: string;
        title: string;
        'primary-type': string;
        'primary-type-id': string;
        'secondary-types': string[];
        'secondary-type-ids': string[];
        disambiguation: string;
        'first-release-date': string;
    };
    'artist-credit': {
        artist: {
            id: string;
            name: string;
            'sort-name': string;
        };
    }[];
};
