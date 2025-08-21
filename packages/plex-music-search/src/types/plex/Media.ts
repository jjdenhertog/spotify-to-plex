import { MediaPart } from "./MediaPart";


export type Media = {
    id: number;
    duration: number;
    bitrate: number;
    audioChannels: number;
    audioCodec: string;
    container: string;
    Part: MediaPart[];
};
