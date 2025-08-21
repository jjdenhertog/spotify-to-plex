export type MediaPart = {
    id: number;
    key: string;
    duration: number;
    file: string;
    size: number;
    container: string;
    hasThumbnail: '1' | '0';
};
