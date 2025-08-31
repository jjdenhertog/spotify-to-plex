/* eslint-disable custom/no-export-only-files */
/* eslint-disable max-lines */
export type AuthenticateResponse = {
    scope: string
    token_type: string
    access_token: string,
    expires_in: number
}
export type TidalComponents = {
    schemas: {
        Error_Document: {
            /** @description array of error objects */
            errors?: TidalComponents["schemas"]["Error_Object"][];
            links?: TidalComponents["schemas"]["Links"];
        };
        Error_Object: {
            /** @description unique identifier for this particular occurrence of the problem */
            id?: string;
            /** @description HTTP status code applicable to this problem */
            status?: string;
            /** @description application-specific error code */
            code?: string;
            /** @description human-readable explanation specific to this occurrence of the problem */
            detail?: string;
            source?: TidalComponents["schemas"]["Error_Object_Source"];
        };
        /** @description object containing references to the primary source of the error */
        Error_Object_Source: {
            /**
             * @description a JSON Pointer [RFC6901] to the value in the request document that caused the error
             * @example /data/attributes/title
             */
            pointer?: string;
            /**
             * @description string indicating which URI query parameter caused the error.
             * @example countryCode
             */
            parameter?: string;
            /**
             * @description string indicating the name of a single request header which caused the error
             * @example X-some-custom-header
             */
            header?: string;
        };
        /** @description links object */
        Links: {
            /**
             * @description the link that generated the current response document
             * @example /artists/xyz/relationships/tracks
             */
            self: string;
            /**
             * @description the next page of data (pagination)
             * @example /artists/xyz/relationships/tracks?page[cursor]=zyx
             */
            next?: string;
        };
        /** @description attributes object representing some of the resource's data */
        Albums_Attributes: {
            /**
             * @description Original title
             * @example 4:44
             */
            title: string;
            /**
             * @description Barcode id (EAN-13 or UPC-A)
             * @example 00854242007552
             */
            barcodeId: string;
            /**
             * Format: int32
             * @description Number of volumes
             * @example 1
             */
            numberOfVolumes: number;
            /**
             * Format: int32
             * @description Number of album items
             * @example 13
             */
            numberOfItems: number;
            /**
             * @description Duration (ISO-8601)
             * @example P41M5S
             */
            duration: string;
            /**
             * @description Indicates whether an album consist of any explicit content
             * @example true
             */
            explicit: boolean;
            /**
             * Format: date
             * @description Release date (ISO-8601)
             * @example 2017-06-30
             */
            releaseDate?: string;
            /**
             * @description Copyright information
             * @example (p)(c) 2017 S. CARTER ENTERPRISES, LLC. MARKETED BY ROC NATION & DISTRIBUTED BY ROC NATION/UMG RECORDINGS INC.
             */
            copyright?: string;
            /**
             * Format: double
             * @description Album popularity (ranged in 0.00 ... 1.00). Conditionally visible
             * @example 0.56
             */
            popularity: number;
            /** @description Defines an album availability e.g. for streaming, DJs, stems */
            availability?: ("STREAM" | "DJ" | "STEM")[];
            mediaTags: string[];
            /** @description Represents available links to, and metadata about, an album cover images */
            imageLinks?: TidalComponents["schemas"]["Catalogue_Item_Image_Link"][];
            /** @description Represents available links to, and metadata about, an album cover videos */
            videoLinks?: TidalComponents["schemas"]["Catalogue_Item_Video_Link"][];
            /** @description Represents available links to something that is related to an album resource, but external to the TIDAL API */
            externalLinks?: TidalComponents["schemas"]["Catalogue_Item_External_Link"][];
        };
        Albums_Item_Resource_Identifier: {
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: 'albums';
            meta?: TidalComponents["schemas"]["Albums_Item_Resource_Identifier_Meta"];
        };
        Albums_Item_Resource_Identifier_Meta: {
            /**
             * Format: int32
             * @description volume number
             * @example 1
             */
            volumeNumber: number;
            /**
             * Format: int32
             * @description track number
             * @example 4
             */
            trackNumber: number;
        };
        /** @description Album items (tracks/videos) relationship */
        Albums_Items_Relationship: {
            data?: TidalComponents["schemas"]["Albums_Item_Resource_Identifier"][][];
            links?: TidalComponents["schemas"]["Links"];
        };
        /** @description attributes object representing some of the resource's data */
        Search_Results_Attributes: {
            /**
             * @description search request unique tracking number
             * @example 5896e37d-e847-4ca6-9629-ef8001719f7f
             */
            trackingId: string;
            /**
             * @description 'did you mean' prompt
             * @example beatles
             */
            didYouMean?: string;
        };
        /** @description relationships object describing relationships between the resource and other resources */
        Search_Results_Relationships: {
            albums: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            artists: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            tracks: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            videos: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            playlists: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            topHits: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
        };
        /** @description primary resource data */
        Search_Results_Resource: {
            attributes?: TidalComponents["schemas"]["Search_Results_Attributes"];
            relationships?: TidalComponents["schemas"]["Search_Results_Relationships"];
            links?: TidalComponents["schemas"]["Links"];
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: string;
        };
        Search_Results_Single_Data_Document: {
            data?: TidalComponents["schemas"]["Search_Results_Resource"];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Playlists_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Users_Resource"])[];
        };
        Search_Results_Top_Hits_Relationship_Document: {
            /** @description array of relationship resource linkages */
            data?: TidalComponents["schemas"]["Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Playlists_Resource"] | TidalComponents["schemas"]["Users_Resource"])[];
        };
        Playlists_Relationship_Document: {
            /** @description array of relationship resource linkages */
            data?: TidalComponents["schemas"]["Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Playlists_Resource"] | TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Users_Resource"])[];
        };
        /** @description relationships object describing relationships between the resource and other resources */
        Albums_Relationships: {
            artists: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            items: TidalComponents["schemas"]["Albums_Items_Relationship"];
            similarAlbums: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            providers: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
        };
        Albums_Resource: {
            attributes?: TidalComponents["schemas"]["Albums_Attributes"];
            relationships?: TidalComponents["schemas"]["Albums_Relationships"];
            links?: TidalComponents["schemas"]["Links"];
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: 'albums';
        };
        /** @description attributes object representing some of the resource's data */
        Artists_Attributes: {
            /**
             * @description Artist name
             * @example JAY Z
             */
            name: string;
            /**
             * Format: double
             * @description Artist popularity (ranged in 0.00 ... 1.00). Conditionally visible
             * @example 0.56
             */
            popularity: number;
            /** @description Represents available links to, and metadata about, an artist images */
            imageLinks?: TidalComponents["schemas"]["Catalogue_Item_Image_Link"][];
            /** @description Represents available links to something that is related to an artist resource, but external to the TIDAL API */
            externalLinks?: TidalComponents["schemas"]["Catalogue_Item_External_Link"][];
        };
        /** @description relationships object describing relationships between the resource and other resources */
        Artists_Relationships: {
            albums: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            tracks: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            videos: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            similarArtists: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            trackProviders: TidalComponents["schemas"]["Artists_Track_Providers_Relationship"];
            radio: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
        };
        Artists_Resource: {
            attributes?: TidalComponents["schemas"]["Artists_Attributes"];
            relationships?: TidalComponents["schemas"]["Artists_Relationships"];
            links?: TidalComponents["schemas"]["Links"];
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: 'artists';
        };
        /** @description Providers that have released tracks for this artist */
        Artists_Track_Providers_Relationship: {
            data?: TidalComponents["schemas"]["Artists_Track_Providers_Resource_Identifier"][][];
            links?: TidalComponents["schemas"]["Links"];
        };
        Artists_Track_Providers_Resource_Identifier: {
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: string;
            meta?: TidalComponents["schemas"]["Artists_Track_Providers_Resource_Identifier_Meta"];
        };
        Artists_Track_Providers_Resource_Identifier_Meta: {
            /**
             * Format: int64
             * @description total number of tracks released together with the provider
             * @example 14
             */
            numberOfTracks: number;
        };
        Catalogue_Item_External_Link: {
            /**
             * @description link to something that is related to a resource
             * @example https://tidal.com/browse/artist/1566
             */
            href: string;
            meta: TidalComponents["schemas"]["External_Link_Meta"];
        };
        Catalogue_Item_Image_Link: {
            /**
             * @description link to an image
             * @example https://resources.tidal.com/images/717dfdae/beb0/4aea/a553/a70064c30386/80x80.jpg
             */
            href: string;
            meta: TidalComponents["schemas"]["Image_Link_Meta"];
        };
        Catalogue_Item_Video_Link: {
            /**
             * @description link to a video
             * @example https://resources.tidal.com/images/717dfdae/beb0/4aea/a553/a70064c30386/80x80.mp4
             */
            href: string;
            meta: TidalComponents["schemas"]["Video_Link_Meta"];
        };
        /** @description metadata about an external link */
        External_Link_Meta: {
            /**
             * @description external link type
             * @example TIDAL_SHARING
             * @enum {string}
             */
            type: "TIDAL_SHARING" | "TIDAL_AUTOPLAY_ANDROID" | "TIDAL_AUTOPLAY_IOS" | "TIDAL_AUTOPLAY_WEB" | "TWITTER" | "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "SNAPCHAT" | "HOMEPAGE";
        };
        /** @description metadata about an image */
        Image_Link_Meta: {
            /**
             * Format: int32
             * @description image width (in pixels)
             * @example 80
             */
            width: number;
            /**
             * Format: int32
             * @description image height (in pixels)
             * @example 80
             */
            height: number;
        };
        /** @description Playlist owners relationship */
        Multi_Data_Relationship_Doc: {
            /** @description array of relationship resource linkages */
            data?: TidalComponents["schemas"]["Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
        };
        /** @description attributes object representing some of the resource's data */
        Playlists_Attributes: {
            /**
             * @description Playlist name
             * @example My Playlist
             */
            name: string;
            /**
             * @description Playlist description
             * @example All the good details about what is inside this playlist
             */
            description?: string;
            /**
             * @description Indicates if the playlist has a duration and set number of tracks
             * @example true
             */
            bounded: boolean;
            /**
             * @description Duration of the playlist expressed in accordance with ISO 8601
             * @example P30M5S
             */
            duration?: string;
            /**
             * Format: int32
             * @description Number of items in the playlist
             * @example 5
             */
            numberOfItems?: number;
            /**
             * @description Sharing links to the playlist
             * @example true
             */
            externalLinks: TidalComponents["schemas"]["Playlists_External_Link"][];
            /**
             * Format: date-time
             * @description Datetime of playlist creation (ISO 8601)
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description Datetime of last modification of the playlist (ISO 8601)
             */
            lastModifiedAt: string;
            /**
             * @description Privacy setting of the playlist
             * @example PUBLIC
             */
            privacy: string;
            /**
             * @description The type of the playlist
             * @example EDITORIAL
             */
            playlistType: string;
            /**
             * @description Images associated with the playlist
             * @example true
             */
            imageLinks: TidalComponents["schemas"]["Playlists_Image_Link"][];
        };
        /**
         * @description Sharing links to the playlist
         * @example true
         */
        Playlists_External_Link: {
            /**
             * @description link to something that is related to a resource
             * @example https://tidal.com/browse/artist/1566
             */
            href: string;
            meta: TidalComponents["schemas"]["External_Link_Meta"];
        };
        /**
         * @description Images associated with the playlist
         * @example true
         */
        Playlists_Image_Link: {
            /**
             * @description link to an image
             * @example https://resources.tidal.com/images/717dfdae/beb0/4aea/a553/a70064c30386/80x80.jpg
             */
            href: string;
            meta?: TidalComponents["schemas"]["Image_Link_Meta"];
        };
        /** @description relationships object describing relationships between the resource and other resources */
        Playlists_Relationships: {
            items: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            owners: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
        };
        Playlists_Resource: {
            attributes?: TidalComponents["schemas"]["Playlists_Attributes"];
            relationships?: TidalComponents["schemas"]["Playlists_Relationships"];
            links?: TidalComponents["schemas"]["Links"];
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: 'playlists'
        };
        /** @description attributes object representing some of the resource's data */
        Providers_Attributes: {
            /**
             * @description Provider name. Conditionally visible.
             * @example Columbia/Legacy
             */
            name: string;
        };
        /** @description relationships object describing relationships between the resource and other resources */
        Providers_Relationships: Record<string, never>;
        Providers_Resource: {
            attributes?: TidalComponents["schemas"]["Providers_Attributes"];
            relationships?: TidalComponents["schemas"]["Providers_Relationships"];
            links?: TidalComponents["schemas"]["Links"];
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: 'providers';
        };
        /** @description array of relationship resource linkages */
        Resource_Identifier: {
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: string;
        };
        /** @description attributes object representing some of the resource's data */
        Tracks_Attributes: {
            /**
             * @description Album item's title
             * @example Kill Jay Z
             */
            title: string;
            /**
             * @description Version of the album's item; complements title
             * @example Kill Jay Z
             */
            version?: string;
            /**
             * @description ISRC code
             * @example TIDAL2274
             */
            isrc: string;
            /**
             * @description Duration expressed in accordance with ISO 8601
             * @example P30M5S
             */
            duration: string;
            /**
             * @description Copyright information
             * @example (p)(c) 2017 S. CARTER ENTERPRISES, LLC. MARKETED BY ROC NATION & DISTRIBUTED BY ROC NATION/UMG RECORDINGS INC.
             */
            copyright?: string;
            /**
             * @description Indicates whether a catalog item consist of any explicit content
             * @example false
             */
            explicit: boolean;
            /**
             * Format: double
             * @description Track or video popularity (ranged in 0.00 ... 1.00). Conditionally visible
             * @example 0.56
             */
            popularity: number;
            /** @description Defines a catalog item availability e.g. for streaming, DJs, stems */
            availability?: ("STREAM" | "DJ" | "STEM")[];
            mediaTags: string[];
            /** @description Represents available links to something that is related to a catalog item, but external to the TIDAL API */
            externalLinks?: TidalComponents["schemas"]["Catalogue_Item_External_Link"][];
        };
        /** @description relationships object describing relationships between the resource and other resources */
        Tracks_Relationships: {
            albums: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            artists: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            providers: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            similarTracks: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            radio: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
        };
        Tracks_Resource: {
            attributes?: TidalComponents["schemas"]["Tracks_Attributes"];
            relationships?: TidalComponents["schemas"]["Tracks_Relationships"];
            links?: TidalComponents["schemas"]["Links"];
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: 'tracks';
        };
        /** @description metadata about a video */
        Video_Link_Meta: {
            /**
             * Format: int32
             * @description video width (in pixels)
             * @example 80
             */
            width: number;
            /**
             * Format: int32
             * @description video height (in pixels)
             * @example 80
             */
            height: number;
        };
        /** @description attributes object representing some of the resource's data */
        Videos_Attributes: {
            /**
             * @description Album item's title
             * @example Kill Jay Z
             */
            title: string;
            /**
             * @description Version of the album's item; complements title
             * @example Kill Jay Z
             */
            version?: string;
            /**
             * @description ISRC code
             * @example TIDAL2274
             */
            isrc: string;
            /**
             * @description Duration expressed in accordance with ISO 8601
             * @example P30M5S
             */
            duration: string;
            /**
             * @description Copyright information
             * @example (p)(c) 2017 S. CARTER ENTERPRISES, LLC. MARKETED BY ROC NATION & DISTRIBUTED BY ROC NATION/UMG RECORDINGS INC.
             */
            copyright?: string;
            /**
             * Format: date
             * @description Release date (ISO-8601)
             * @example 2017-06-27
             */
            releaseDate?: string;
            /**
             * @description Indicates whether a catalog item consist of any explicit content
             * @example false
             */
            explicit: boolean;
            /**
             * Format: double
             * @description Track or video popularity (ranged in 0.00 ... 1.00). Conditionally visible
             * @example 0.56
             */
            popularity: number;
            /** @description Defines a catalog item availability e.g. for streaming, DJs, stems */
            availability?: ("STREAM" | "DJ" | "STEM")[];
            /** @description Represents available links to, and metadata about, an album item images */
            imageLinks?: TidalComponents["schemas"]["Catalogue_Item_Image_Link"][];
            /** @description Represents available links to something that is related to a catalog item, but external to the TIDAL API */
            externalLinks?: TidalComponents["schemas"]["Catalogue_Item_External_Link"][];
        };
        Videos_Multi_Data_Document: {
            /** @description array of primary resource data */
            data?: TidalComponents["schemas"]["Videos_Resource"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Playlists_Resource"])[];
        };
        /** @description relationships object describing relationships between the resource and other resources */
        Videos_Relationships: {
            albums: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            artists: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
            providers: TidalComponents["schemas"]["Multi_Data_Relationship_Doc"];
        };
        Videos_Resource: {
            attributes?: TidalComponents["schemas"]["Videos_Attributes"];
            relationships?: TidalComponents["schemas"]["Videos_Relationships"];
            links?: TidalComponents["schemas"]["Links"];
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: 'videos';
        };
        Videos_Single_Data_Document: {
            data?: TidalComponents["schemas"]["Videos_Resource"];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Playlists_Resource"])[];
        };
        Providers_Relationship_Document: {
            /** @description array of relationship resource linkages */
            data?: TidalComponents["schemas"]["Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: TidalComponents["schemas"]["Providers_Resource"][];
        };
        Artists_Relationship_Document: {
            /** @description array of relationship resource linkages */
            data?: TidalComponents["schemas"]["Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Playlists_Resource"])[];
        };
        Albums_Relationship_Document: {
            /** @description array of relationship resource linkages */
            data?: TidalComponents["schemas"]["Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"])[];
        };
        /** @description User recommendations */
        Singleton_Data_Relationship_Doc: {
            data?: TidalComponents["schemas"]["Resource_Identifier"];
            links?: TidalComponents["schemas"]["Links"];
        };
        Tracks_Multi_Data_Document: {
            /** @description array of primary resource data */
            data?: TidalComponents["schemas"]["Tracks_Resource"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Playlists_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Users_Resource"])[];
        };
        /** @description attributes object representing some of the resource's data */
        Users_Attributes: {
            /**
             * @description user name
             * @example username
             */
            username: string;
            /**
             * @description ISO 3166-1 alpha-2 country code
             * @example US
             */
            country: string;
            /**
             * @description email address
             * @example test@test.com
             */
            email?: string;
            /**
             * @description Is the email verified
             * @example true
             */
            emailVerified?: boolean;
            /**
             * @description Users first name
             * @example John
             */
            firstName?: string;
            /**
             * @description Users last name
             * @example Rambo
             */
            lastName?: string;
        };
        /** @description relationships object describing relationships between the resource and other resources */
        Users_Relationships: {
            entitlements: TidalComponents["schemas"]["Singleton_Data_Relationship_Doc"];
            publicProfile: TidalComponents["schemas"]["Singleton_Data_Relationship_Doc"];
            recommendations: TidalComponents["schemas"]["Singleton_Data_Relationship_Doc"];
        };
        Users_Resource: {
            attributes?: TidalComponents["schemas"]["Users_Attributes"];
            relationships?: TidalComponents["schemas"]["Users_Relationships"];
            links?: TidalComponents["schemas"]["Links"];
            /**
             * @description resource unique identifier
             * @example 12345
             */
            id: string;
            /**
             * @description resource unique type
             * @example tracks
             */
            type: 'users';
        };
        Tracks_Single_Data_Document: {
            data?: TidalComponents["schemas"]["Tracks_Resource"];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Playlists_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Users_Resource"])[];
        };
        Tracks_Relationships_Document: {
            /** @description array of relationship resource linkages */
            data?: TidalComponents["schemas"]["Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Playlists_Resource"])[];
        };
        Providers_Multi_Data_Document: {
            /** @description array of primary resource data */
            data?: TidalComponents["schemas"]["Providers_Resource"][];
            links?: TidalComponents["schemas"]["Links"];
        };
        Providers_Single_Data_Document: {
            data?: TidalComponents["schemas"]["Providers_Resource"];
            links?: TidalComponents["schemas"]["Links"];
        };
        Artists_Multi_Data_Document: {
            /** @description array of primary resource data */
            data?: TidalComponents["schemas"]["Artists_Resource"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Playlists_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Users_Resource"])[];
        };
        Artists_Single_Data_Document: {
            data?: TidalComponents["schemas"]["Artists_Resource"];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Playlists_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Users_Resource"])[];
        };
        Videos_Relationships_Document: {
            /** @description array of relationship resource linkages */
            data?: TidalComponents["schemas"]["Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Providers_Resource"])[];
        };
        Artists_Track_Providers_Relationship_Document: {
            data?: TidalComponents["schemas"]["Artists_Track_Providers_Resource_Identifier"][][];
            links?: TidalComponents["schemas"]["Links"];
            included?: TidalComponents["schemas"]["Providers_Resource"][];
        };
        Albums_Multi_Data_Document: {
            /** @description array of primary resource data */
            data?: TidalComponents["schemas"]["Albums_Resource"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Playlists_Resource"])[];
        };
        Albums_Single_Data_Document: {
            data?: TidalComponents["schemas"]["Albums_Resource"];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Playlists_Resource"])[];
        };
        Albums_Items_Relationship_Document: {
            data?: TidalComponents["schemas"]["Albums_Item_Resource_Identifier"][];
            links?: TidalComponents["schemas"]["Links"];
            included?: (TidalComponents["schemas"]["Tracks_Resource"] | TidalComponents["schemas"]["Videos_Resource"] | TidalComponents["schemas"]["Artists_Resource"] | TidalComponents["schemas"]["Providers_Resource"] | TidalComponents["schemas"]["Albums_Resource"] | TidalComponents["schemas"]["Playlists_Resource"])[];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = {
    getSearchResultsByQuery: TidalComponents["schemas"]["Search_Results_Single_Data_Document"];
    getSearchResultsVideosRelationship: TidalComponents["schemas"]["Videos_Relationships_Document"];
    getSearchResultsTracksRelationship: TidalComponents["schemas"]["Tracks_Relationships_Document"];
    getSearchResultsTopHitsRelationship: TidalComponents["schemas"]["Search_Results_Top_Hits_Relationship_Document"];
    getSearchResultsPlaylistsRelationship: TidalComponents["schemas"]["Playlists_Relationship_Document"];
    getSearchResultsArtistsRelationship: TidalComponents["schemas"]["Artists_Relationship_Document"];
    getSearchResultsAlbumsRelationship: TidalComponents["schemas"]["Albums_Relationship_Document"];
    getVideosByFilters: TidalComponents["schemas"]["Videos_Multi_Data_Document"];
    getVideoById: TidalComponents["schemas"]["Videos_Single_Data_Document"];
    getVideoProvidersRelationship: TidalComponents["schemas"]["Providers_Relationship_Document"];
    getVideoArtistsRelationship: TidalComponents["schemas"]["Artists_Relationship_Document"];
    getVideoAlbumsRelationship: TidalComponents["schemas"]["Albums_Relationship_Document"];
    getTracksByFilters: TidalComponents["schemas"]["Tracks_Multi_Data_Document"];
    getTrackById: TidalComponents["schemas"]["Tracks_Single_Data_Document"];
    getTrackSimilarTracksRelationship: TidalComponents["schemas"]["Tracks_Relationships_Document"];
    getTrackRadioRelationship: TidalComponents["schemas"]["Tracks_Relationships_Document"];
    getTrackProvidersRelationship: TidalComponents["schemas"]["Providers_Relationship_Document"];
    getTrackArtistsRelationship: TidalComponents["schemas"]["Artists_Relationship_Document"];
    getTrackAlbumsRelationship: TidalComponents["schemas"]["Albums_Relationship_Document"];
    getProvidersByFilters: TidalComponents["schemas"]["Providers_Multi_Data_Document"];
    getProviderById: TidalComponents["schemas"]["Providers_Single_Data_Document"];
    getArtistsByFilters: TidalComponents["schemas"]["Artists_Multi_Data_Document"];
    getArtistById: TidalComponents["schemas"]["Artists_Single_Data_Document"];
    getArtistVideosRelationship: TidalComponents["schemas"]["Videos_Relationships_Document"];
    getArtistTracksRelationship: TidalComponents["schemas"]["Tracks_Relationships_Document"];
    getArtistTrackProvidersRelationship: TidalComponents["schemas"]["Artists_Track_Providers_Relationship_Document"];
    getArtistSimilarArtistsRelationship: TidalComponents["schemas"]["Artists_Relationship_Document"];
    getArtistRadioRelationship: TidalComponents["schemas"]["Artists_Relationship_Document"];
    getArtistAlbumsRelationship: TidalComponents["schemas"]["Albums_Relationship_Document"];
    getAlbumsByFilters: TidalComponents["schemas"]["Albums_Multi_Data_Document"];
    getAlbumById: TidalComponents["schemas"]["Albums_Single_Data_Document"];
    getAlbumSimilarAlbumsRelationship: TidalComponents["schemas"]["Albums_Relationship_Document"];
    getAlbumProvidersRelationship: TidalComponents["schemas"]["Providers_Relationship_Document"];
    getAlbumItemsRelationship: TidalComponents["schemas"]["Albums_Items_Relationship_Document"];
    getAlbumArtistsRelationship: TidalComponents["schemas"]["Artists_Relationship_Document"];
}