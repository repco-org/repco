# Description of the data model

The Repco data model is defined as a prisma schema and is actually divided into two data models the Repco domain data model (name: RDDM) and the Repco Lower data model (name: RLDM). For further details checkout the prisma schema.

The RDDM is a data model for storing and managing content and media from community media publishers. It provides a detailed description of the data structure and relationships between entities within the model.

Entities in the RDDM include various types of content and media, such as articles, audio files, and images. Relations between these entities are defined by linking them with unique identifiers (UIDs). The RDDM combined with the RLDM is capable to store and track changes to RDDM entities. The RLDM groups content into repositories, and uses public-key cryptography and capability delegation to provide authenticity to all content within a repository.

The RLDM stores data as InterPlanetary Linked Data ([IPLD](#)) nodes, which are encoded with DAG-[CBOR](https://ipld.io/docs/codecs/known/dag-cbor/) and hashed with [BLAKE-2b](https://www.blake2.net/). These nodes are grouped into repositories, which are identified by a decentralized identifier ([DID](https://decentralized-id.com/web-standards/w3c/wg/did/decentralized-identifier/)). Currently, only the did:key scheme with Ed25519 keys is supported. A repository in the RLDM is a log of commits, each referring to the previous commit and the contained revisions through content-addressed links (CIDs). A commit contains a list of revisions, which include headers and a link to the revision's content. The content is the RDDM object in IPLD form, and relations between entities are expressed as UIDs.

The RLDM authenticates commits through [UCANs](https://ucan.xyz/) (Unforgeable Capability-based Authenticated Names). These UCANs must be issued by, or delegated from, the owner keypair of the repository. The RLDM also defines internal entity IDs (uids) and external unique identifiers (uris) for entities.

The RLDM defines a few headers that are part of the revision IPLD, including metadata such as the entity type, previous revision ID, and creation and modification timestamps.


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
| SourceRecord    | The original content which is imported and mapped                             |
| ContentGrouping | Defines if it is an episode or a series                                      |
| ContentItem     | Container for a contribution or composition of content                       |
| License         | An official permission or permit                                             |
| MediaAsset      | A container for audio, video, image or document with some metadata           |
| Contribution    | A container for ContentItems, Actors and MediaAsstes with a special role     |
| Contributor     | A person or organization which has contributed to a content                  |
| Chapter         | A part of a MediaAsset                                                       |
| BrodcastEvent   | The event being broadcast such as a sporting event or awards ceremony.       |
| PublicationService | he media network(s) whose content is broadcast on this station.              |
| Transcript      | Transcript of a media file                                                   |
| Translation     | Translation of a media file
| File            | A file which belongs to a MediaAsset                                         |
| Concept         | Something that is like a universe in terms of media like the Marvel Universe |
| Metadata        | Further data which belonges to an Entity                                     |

## Decisions and changes

The data model was developed in close cooperation with the community around the [ECB](https://cba.fro.at/building-a-european-cultural-backbone) and the steakholders from some community media radiostations. Technically necessary changes were made in consensus with the developer team. For the future changes should be clarified in close consultation with the community. For technical changes a technical consultation with the main developers is required. Changes should not cause any breacking changes after a stable release but as we are still in a very early and prototypical phase of the project this is possible at this point of time.
