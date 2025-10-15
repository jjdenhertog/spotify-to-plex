export type MusicBrainzUrlResponse = {
    id: string;
    resource: string;
    relations: {
        type: string;
        'type-id': string;
        direction: string;
        'target-type': string;
        release?: {
            id: string;
            title: string;
            disambiguation: string;
            status: string | null;
            'status-id': string | null;
            date: string;
            country: string;
            barcode: string | null;
            packaging: string | null;
            'packaging-id': string | null;
            'text-representation': {
                language: string;
                script: string;
            };
            'release-events': {
                date: string;
                area: {
                    id: string;
                    name: string;
                    'sort-name': string;
                    'iso-3166-1-codes': string[];
                };
            }[];
        };
    }[];
};
