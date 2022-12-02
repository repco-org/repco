# Description of the data model

The Repco data model is defined as a prisma schema and is actually divided into two data models the Repco domain data model (name: RDDM) and the Repco Lower data model (name: RLDM). For further details checkout the prisma schema.

## RLDM

Repco lower data model (name: RLDM, tbd). The RLDM is the data model used to store RDDM entities, track their changes and replicate them between repco nodes. RLDM groups content into _repos_, and provides authenticity to all content within a repo through public-key cryptograpy and capability delegation.


The RLDM defines the common entities, the relations and headers which are needed to manage, replicate etc. pp. the content and media of the publishers in Repco.

| Model      | Description                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Repo       | Container or repository that contains various data sources. A repo can be mirrored/replicated   |
| Commit     | Commit is central building blocks for versioning changes.                                       |
| Agent      | The user or datasource that makes a change                                                      |
| User       | A user who can initiate changes.                                                                |
| Ucans      | User Controlled Authorization Networks <https://ucan.xyz/>                                      |
| Datasource | A publisher or a collection of publishers like FRN, CBA XRCB                                    |
| Keypair    | The Keypair of a Repo which is stored in a Database. Further details in Repo in Details.        |
| Block      | A Block of data which is hashed and stored in a blockstore. Further details in Repo in Details. |
| Entity     | Abstraction of the RLDM entities                                                                |
| Revision   | The version of a commit that links the entities and headers                                     |

## RDDM

The RDDM defines entities which are managed in the RLDM. 
Each entity has a uid and a revision id, both are unique.

| Entity          | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| SourceRecord    | The original content which is impoted and mapped                             |
| ContentGrouping | Defines if it is an episode or a series                                      |
| ContentItem     | Container for a contribution or composition of content                       |
| Liecense        | An official permission or permit                                             |
| MediaAsset      | A Container for audio, video, image or document with some metadata           |
| Contribution    | A Container for ContentItems, Actors and MediaAsstes with a special role     |
| Actor           | A Pwrson or organization which has contributed to a content                  |
| Chapter         | A part of a MediaAsset                                                       |
| BrodcastEvent   | The event being broadcast such as a sporting event or awards ceremony.       |
| BrodcastService | he media network(s) whose content is broadcast on this station.              |
| Transcript      | Transcript of a media file                                                   |
| File            | A file which belongs to a MediaAsset                                         |
| Concept         | Something that is like a universe in terms of media like the Marvel Universe |
| Metadata        | Further data which belonges to an Entity                                     |

## further notes

- RLDM stores all data as [IPLD](https://ipld.io/) nodes. For storage and serialization, these nodes are encoded with [DAG-CBOR](https://ipld.io/docs/codecs/known/dag-cbor/) and hashed with [BLAKE-2b](https://www.blake2.net/). (TODO: Rationale, and/or switch to Blake3 or SHA-256?).

  

- RLDM groups objects into Repos. A Repo is defined by a [decentralized identifier (DID)](https://decentralized-id.com/web-standards/w3c/wg/did/decentralized-identifier/). Currently, only the `did:key` scheme is supported with `Ed25591`[keys](https://ed25519.cr.yp.to/).

  

- A repo in RLDM is a log of `commit`s, each refering to the previous commit and the contained revisions through [content-addressed links (CIDs)](https://docs.ipfs.tech/concepts/content-addressing/). A `commit` contains a list of `revision`s. A `revision` contains a set of headers and a link to this revision’s content.

  

- The content is the RDDM object in IPLD form. Relations are expressed as `{ uid: UID }` where UID is the uid of the relation’s target entity. Optionally, relations can be pinned to a specific revision by using the form `{ uid: UID, cid: CID }`. In this case CID is the revision’s CID (not the CID of the entity content).
- RDLM defines `Revisions` with `Content`, `Commits` and `Roots`
  

- RLDM authenticates commits through [UCANs](https://ucan.xyz/). The UCAN has to be issued by (or delegated from) the owner keypair of the Repo.

  

- Roots contain a link to a commit, the DID of the Agent who created the commit, a UCAN that encodes the capability of the agent to publish into the repo to which the commit belongs, and a signature that signs this data with the Keypair of the Agent.

  

- RLDM also defines `uid`s (internal entity IDs) and `uri`s (external unique identifiers)

  

- RLDM defines a few headers that are part of the Revision IPLD. They assign metadata to revisions of entities.
  - id: string
  - uid: string
  - entityType: string
  - prevRevisionId: string
  - revisionUris: string[]
  - entityUri: string[]
  - createdAt
  - modifiedAt

## Decisions and changes

The data model was developed in close cooperation with the community around the [ECB](https://cba.fro.at/building-a-european-cultural-backbone) and the steakholders from the community media radiostations. Technically necessary changes were made in consensus with the developer team. For the future changes should be clarified in close consultation with the community. For technical changes a technical consultation with the main developers is required. Changes should not cause any breacking changes after a stable release but as we are still in a very early and prototypical phase of the project this is possible at this point of time.

