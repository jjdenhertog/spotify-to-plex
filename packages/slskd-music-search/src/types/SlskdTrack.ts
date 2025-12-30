export type SlskdTrack = {
    id: string;
    title: string;
    artist: {
        id: string;
        title: string;
    };
    album?: {
        id: string;
        title: string;
    };

    src: string;
    username: string;
    filename: string;
    size: number;
    extension: string;
    bitRate?: number;
    sampleRate?: number;
    bitDepth?: number;
    length?: number;
    isLocked: boolean;
    metadata?: {
        artist: string;
        title: string;
        album: string;
        pattern: string;
        confidence: number;
    };

    matching?: {
        album: { match: boolean; contains: boolean; similarity: number; };
        title: { match: boolean; contains: boolean; similarity: number; };
        artist: { match: boolean; contains: boolean; similarity: number; };
        artistInTitle: { match: boolean; contains: boolean; similarity: number; };
        artistWithTitle: { match: boolean; contains: boolean; similarity: number; };
        alternativeArtist?: { match: boolean; contains: boolean; similarity: number; };
        isMatchingApproach?: boolean;
    };
    reason?: string;
};
