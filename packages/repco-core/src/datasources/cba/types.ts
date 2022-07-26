export interface CbaPost {
    id:              number;
    date:            Date;
    date_gmt:        Date;
    guid:            GUID;
    modified:        Date;
    modified_gmt:    Date;
    slug:            string;
    status:          string;
    type:            string;
    link:            string;
    title:           GUID;
    content:         Content;
    excerpt:         Content;
    author:          number;
    featured_media:  number;
    comment_status:  string;
    ping_status:     string;
    sticky:          boolean;
    template:        string;
    format:          string;
    meta:            Meta;
    categories:      number[];
    tags:            number[];
    language:        number[];
    editor:          number[];
    acf:             any[];
    post_parent:     number;
    featured_image:  number;
    production_date: Date;
    _links:          Links;
    mediaAssets:    string[];
}


export interface About {
    href: string;
}


export interface Cury {
    name:      string;
    href:      string;
    templated: boolean;
}

export interface PredecessorVersion {
    id:   number;
    href: string;
}

export interface VersionHistory {
    count: number;
    href:  string;
}

export interface WpTerm {
    taxonomy:   string;
    embeddable: boolean;
    href:       string;
}

export interface Content {
    rendered:  string;
    protected: boolean;
}

export interface GUID {
    rendered: string;
}

export interface Meta {
    station_id: number;
}

export interface CbaSeries {
    id:             number;
    date:           Date;
    date_gmt:       Date;
    guid:           GUID;
    modified:       Date;
    modified_gmt:   Date;
    slug:           string;
    status:         string;
    type:           string;
    link:           string;
    title:          GUID;
    content:        Content;
    featured_media: number;
    comment_status: string;
    ping_status:    string;
    template:       string;
    acf:            any[];
    post_parent:    number;
    url:            string;
    _links:         Links;
}

export interface Links {
    self:                  About[];
    collection:            About[];
    about:                 About[];
    author:                EmbeddedLink[];
    replies:               EmbeddedLink[];
    "version-history":     VersionHistory[];
    "predecessor-version": PredecessorVersion[];
    series:                EmbeddedLink[];
    station:               EmbeddedLink[];
    featured_image:        EmbeddedLink[];
    "wp:attachment":       About[];
    "wp:featuredmedia":    EmbeddedLink[];
    "wp:term":             WpTerm[];
    curies:                Cury[];
}
export interface EmbeddedLink {
    embeddable: boolean;
    href:       string;
}
