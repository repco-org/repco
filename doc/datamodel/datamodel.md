# Description of the data model

The Repco data model is defined as a prisma schema and is actually divided into two data models the Repco domain data model (name: RDDM) and the Repco Lower data model (name: RLDM). For further details checkout the prisma schema.

## RLDM

The RLDM defines the common entities, the relations and headers which are needed to manage, replicate etc. pp. the content and media of the publishers in Repco.

| Model      | Description                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------- |
| Repo       | Container or repository that contains various data sources. A repo can be mirrored/replicated |
| Commit     | Commit is central building blocks for versioning changes.                                     |
| Agent      | The user or datasource that makes a change                                                    |
| User       | A user who can initiate changes.                                                              |
| Ucans      | User Controlled Authorization Networks <https://ucan.xyz/>                                    |
| Datasource | A publisher or a collection of publishers like FRN, CBA, XRCB                                 |
| Keypair    | The keypair of a Repo which is stored in a database.                                          |
| Block      | A Block of data which is hashed and stored in a blockstore.                                   |
| Entity     | Abstraction of the RLDM entities                                                              |
| Revision   | The version of a commit that links the entities and headers                                   |

## RDDM

The RDDM defines entities which are managed in the RLDM.
Each entity has a `uid` and a `revisionId`, both are unique.

| Entity          | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| SourceRecord    | The original content which is impoted and mapped                             |
| ContentGrouping | Defines if it is an episode or a series                                      |
| ContentItem     | Container for a contribution or composition of content                       |
| Liecense        | An official permission or permit                                             |
| MediaAsset      | A container for audio, video, image or document with some metadata           |
| Contribution    | A container for ContentItems, Actors and MediaAsstes with a special role     |
| Actor           | A person or organization which has contributed to a content                  |
| Chapter         | A part of a MediaAsset                                                       |
| BrodcastEvent   | The event being broadcast such as a sporting event or awards ceremony.       |
| BrodcastService | he media network(s) whose content is broadcast on this station.              |
| Transcript      | Transcript of a media file                                                   |
| File            | A file which belongs to a MediaAsset                                         |
| Concept         | Something that is like a universe in terms of media like the Marvel Universe |
| Metadata        | Further data which belonges to an Entity                                     |

## Decisions and changes

The data model was developed in close cooperation with the community around the [ECB](https://cba.fro.at/building-a-european-cultural-backbone) and the steakholders from some community media radiostations. Technically necessary changes were made in consensus with the developer team. For the future changes should be clarified in close consultation with the community. For technical changes a technical consultation with the main developers is required. Changes should not cause any breacking changes after a stable release but as we are still in a very early and prototypical phase of the project this is possible at this point of time.
