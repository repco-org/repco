# Repository

A repo, or repository, is a list of commits. Each commit contains a list of revisions, which hold the actual content.

A repo is represented by a keypair, which is stored in the database. The ****[DID of the public key](https://w3c-ccg.github.io/did-method-key/)**** serves as the primary ID for the repo, while the repo also has a name for local identification.

The repo is modeled as an ****[IPLD](https://ipld.io/)**** merkle tree, with each block of data (content, revision, commit) being hashed and stored together with its content hash (encoded as a ****[CID](https://docs.filebase.com/ipfs/ipfs-cids)****) in a blockstore. A revision contains the CID of its content, while a commit contains the CIDs of the revisions that are part of the commit. In addition, each commit always contains the CID of its parent commit.

The CID of each commit is signed, currently always with the repo keypair. This will change in the future to allow for other keypairs to be authorized to sign updates to a repo using ****[UCANs](https://ucan.xyz/)****. The structure **{ commitCID, signature }** is then stored as a block, and the hash (CID) of this block is the root (head) of the repo. The root hash changes with each commit and contains the signature and latest commit, providing complete proof of the authenticity of the entire repo.

This structure makes it simple and secure to sync repos over untrusted connections or intermediaries.

For synchronization (and import/export), we use ****[CAR](https://ipld.io/specs/transport/car/carv1/)**** streams, which contain the blocks of a repo and allow for incremental decoding and verification. This has already been implemented and tested, though additional tests are always beneficial.
