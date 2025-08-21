export type PostPinResponse = {
    id: number;
    code: string;
    product: string;
    trusted: boolean;
    qr: string;
    clientIdentifier: string;
    location: {
        code: string;
        european_union_member: boolean;
        continent_code: string;
        country: string;
        city: string;
        time_zone: string;
        postal_code: string;
        in_privacy_restricted_country: boolean;
        subdivisions: string;
        coordinates: string;
    };
    expiresIn: number;
    createdAt: string;
    expiresAt: string;
    authToken: string;
    newRegistration: string;
};
