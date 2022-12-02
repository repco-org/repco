# RLDM specification

_This document is a work in progress. It is neither a specification nor a documentation, but we think that the information contained in it is important for the understanding of the data model._

## RLDM

Repco lower data model (name: RLDM, tbd). The RLDM is the data model used to store RDDM entities, track their changes and replicate them between repco nodes. RLDM groups content into _repos_, and provides authenticity to all content within a repo through public-key cryptograpy and capability delegation.

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


## Repo

A repo is a list of commits. Each commit contains a list of revisions. The revisions contain the actual content.

A repo is, at the bottom, a keypair. The keypair is stored in the database. The [DID of the public key](https://w3c-ccg.github.io/did-method-key/) is the repo's primary ID. A repo also has a name for local identification.

From there, a repo is modeled as an [IPLD](https://ipld.io/) merkle tree. Each block of data (content, revision, commit) is hashed, and the block is stored together with its content hash (encoded as a [CID](https://docs.filebase.com/ipfs/ipfs-cids)) in a blockstore. \n A revision contains the CID of its content. A commit contains the CIDs of the revisions that are part of the commit. \n A commit also always contains the CID of its parent commit. \n Each commit CID is signed, currently always with the repo keypair. This will change to allow for other keypairs to be authorized to sign updates to a repo, by using [UCANs](https://ucan.xyz/). \n The structure { commitCID, signature } is then, again, stored as a block. The hash (CID) of _this_ block is the root (head) of a repo. For each commit, this root hash changes. This root hash, with the contained signature and latest commit, thus contains the complete proof of the authenticity of the full repo.

This makes it very simple (and secure) to sync repos over untrusted connections or intermediaries.

For synchronization (and import/export) we use [CAR](https://ipld.io/specs/transport/car/carv1/) streams. They contain the blocks of an repo and allow incremental decoding and verifiation. This is already implemented and tested (a bit, more tests the better).

