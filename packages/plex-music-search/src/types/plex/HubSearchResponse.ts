import { Hub } from "./Hub";


export type HubSearchResponse = {
    MediaContainer: {
        size: number;
        Hub: Hub[];
    };
};
