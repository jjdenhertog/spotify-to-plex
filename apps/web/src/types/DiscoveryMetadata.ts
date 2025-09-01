import { Metadata } from '@spotify-to-plex/shared-types/plex/Metadata';

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