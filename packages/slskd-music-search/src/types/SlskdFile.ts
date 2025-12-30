import { SlskdFileAttribute } from "./SlskdFileAttribute";

export type SlskdFile = {
    username: string;
    filename: string;
    size: number;
    extension: string;
    bitRate?: number;
    sampleRate?: number;
    bitDepth?: number;
    length?: number;
    isLocked: boolean;
    attributes?: SlskdFileAttribute[];
};
