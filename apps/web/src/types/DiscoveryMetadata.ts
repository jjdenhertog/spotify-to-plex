import { Metadata } from './Metadata';

export type DiscoveryMetadata = {
    type: Metadata["type"],
    addedAt: number,
    duration: number,
    grandparentTitle: string,
    guid: string,
    key: string,
    originallyAvailableAt: string,
    parentKey: string,
    parentTitle: string,
    ratingKey: string,
    thumb: string,
    title: string,
    year: number,
    source: string,
}