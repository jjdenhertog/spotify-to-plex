
export type Track = {
    id: string
    artist: string
    title: string
    album?: string
    reason?: string
    matching?: {
        album: { match: boolean; contains: boolean; similarity: number; };
        title: { match: boolean; contains: boolean; similarity: number; };
        artist: { match: boolean; contains: boolean; similarity: number; };
        artistInTitle: { match: boolean; contains: boolean; similarity: number; };
        artistWithTitle: { match: boolean; contains: boolean; similarity: number; };
    }
};
