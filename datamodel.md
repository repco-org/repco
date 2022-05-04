# repco data model

repco defines a data model for the exchange of community media. This represenation is developed to suit a number of domains: Podcasts, community radio and television, conference recordings, collections of cultural heritage, arts.
The data model is intended to be generic enough to fit these domains, and also be specific enough to become a shared basis for replication and shared frontends.

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
   imageID
   conceptID[]
   contributorID[]
}
class Chapter {
    startTime
    endTime
    title
    type[music,speech]
    meta
    concepts
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
    imageID
    variant[EPISODIC|SERIAL]
    broadcastSchedule[channel, rrule]
    contributorIDs
    rssFeedURL
    
    creationDate
    terminationDate
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
    concepts
    showID
    groupingID
    groupingDelta
    contributorID[]
    mediaAssetID[]
    relatedContentItemID[]
}
class Grouping {
    title
    showID
}
class Actor {
    name
    type[person,group,organization]
    name
    contactInformation
    logo/avatar
}
class Image {
    title
    alt
    fileIDs
}
class Contribution {
    contributedTo
    role
    actor
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

