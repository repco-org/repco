# repco data model

repco defines a data model for the exchange of community media. This represenation is developed to suit a number of domains: Podcasts, community radio and television, conference recordings, collections of cultural heritage, arts.
The data model is intended to be generic enough to fit these domains, and also be specific enough to become a shared basis for replication and shared frontends.

The ➜ sigil before a field name denotes that this field is a relation (link) to another entity. Not all relations are marked in the doc, see below for relations left out for clarity of the diagram.

```mermaid
classDiagram
class License {
    name
}
class File {
    contentURL
    mimetype
    size
    hash
    duration
    codec
    bitrate
    resolution
    additionalMetadata
}
class MediaAsset {
   title
   description
   mediaType[audio,video,image,document]
   duration
   ➜image
   ➜concepts
   ➜contributors
   ➜transcripts
}
class Chapter {
    start
    duration
    title
    type[music,speech]
    meta
    ➜concepts
}
class Transcript {
    text
    language
    engine
}

class Collection {
    type[podcast,event]
    title
    subtitle
    summary
    description
    variant[EPISODIC|SERIAL]
    broadcastSchedule[channel, rrule]
    rssFeedURL
    
    creationDate
    terminationDate
    
    ➜image
    ➜contributors
}

class BroadcastEvent {
    startTime
    endTime
    channel
}
class BroadcastChannel {
    name
    publisher
}
class PublicationChannel {
    type(FM, Web)
    address
}
class ContentItem {
    title
    subtitle
    summary
    fullText
    
    ➜collection
    ➜grouping
    groupingDelta
    ➜mediaAssets
    ➜relatedContentItems
    ➜concepts
}

class Grouping {
    title
    ordinalNumber
    ➜show
}

class Actor {
    name
    type[person,group,organization]
    contactInformation
    ➜image
}

class Image {
    title
    alt
    ➜files
}

class Contribution {
    ➜contributedTo
    role
    ➜actor
}

class Concept {
    originNamespace
    name
    summary
    description    
    type[subject,person,event]
    wikidataID
    ➜hasParentConcept
    ➜isChildOf
    ➜isSameAs
    ➜image
}

Contribution --> Actor
Image --> File: 1
ContentItem <--> Collection: n..1
ContentItem <--> Grouping: n..1
ContentItem --> MediaAsset: n..n
Grouping --> Collection: n..1
BroadcastEvent <--> BroadcastChannel
BroadcastChannel <--> PublicationChannel
MediaAsset <--> BroadcastEvent
MediaAsset <--> File
MediaAsset <--> Transcript
MediaAsset <--> Chapter

```
Some relations are left out in the diagram to keep things clearer. Relations not in the diagram but part of the datamodel are:

`License` is linked from `MediaAsset`, `ContentItem`, `Show`, `PublicationChannel`

`Image` is linked from `MediaAsset`, `ContentItem`, `Show`, `Chapter`, `Grouping`

`Contribution` is linked from `MediaAsset`, `ContentItem`, `Collection`

