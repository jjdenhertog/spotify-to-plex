
export type HubSearchAlbumResult = {
    id: string;
    type: "album";
    ratingKey: string;
    guid: string;
    score: number;
    image: string;
    year: number;
    title: string;
    artist: {
        guid: string;
        id: string;
        title: string;
        alternative_title: string;
        image: string;
    };
};
