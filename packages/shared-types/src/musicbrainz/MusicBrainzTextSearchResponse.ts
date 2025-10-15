export type MusicBrainzTextSearchResponse = {
    created: string;
    count: number;
    offset: number;
    'release-groups': {
        id: string;
        'type-id': string;
        score: number;
        'primary-type-id': string;
        'artist-credit-id': string;
        count: number;
        title: string;
        'first-release-date': string;
        'primary-type': string;
        'artist-credit': {
            name: string;
            artist: {
                id: string;
                name: string;
                'sort-name': string;
            };
        }[];
        releases: {
            id: string;
            'status-id': string;
            title: string;
            status: string;
        }[];
    }[];
};
