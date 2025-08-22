export type TidalTrack = {
    id: string;
    title: string;
    link: string;
    artists: {
        name: string;
        link: string;
    }[];
    album: {
        id: string;
        title: string;
        link: string;
    }
};
