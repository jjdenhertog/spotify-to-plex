import { Media } from './Media';

export type Metadata = {
    librarySectionTitle: string,
    score: string,
    ratingKey: string,
    year: string
    key: string,
    parentRatingKey: string,
    grandparentRatingKey: string,
    guid: string,
    originalTitle?:string
    parentGuid: string,
    grandparentGuid: string,
    parentStudio: string,
    type: string,
    title: string,
    grandparentKey: string,
    parentKey: string,
    librarySectionID: 1,
    librarySectionKey: string,
    grandparentTitle: string,
    parentTitle: string,
    summary: string,
    index: number,
    parentIndex: number,
    ratingCount: number,
    parentYear: number,
    thumb: string,
    art: string,
    parentThumb: string,
    grandparentThumb: string,
    grandparentArt: string,
    duration: number,
    addedAt: number,
    updatedAt: number,
    musicAnalysisVersion: string,
    Media: Media[]
}