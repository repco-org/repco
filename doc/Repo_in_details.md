# Repo in details

A repo is a list of commits. Each commit contains a list of revisions. The revisions contain the actual content.

A repo is, at the bottom, a keypair. The keypair is stored in the database. The [DID of the public key](https://w3c-ccg.github.io/did-method-key/) is the repo's primary ID. A repo also has a name for local identification.

From there, a repo is modeled as an [IPLD](https://ipld.io/) merkle tree. Each block of data (content, revision, commit) is hashed, and the block is stored together with its content hash (encoded as a [CID](https://docs.filebase.com/ipfs/ipfs-cids)) in a blockstore. \n A revision contains the CID of its content. A commit contains the CIDs of the revisions that are part of the commit. \n A commit also always contains the CID of its parent commit. \n Each commit CID is signed, currently always with the repo keypair. This will change to allow for other keypairs to be authorized to sign updates to a repo, by using [UCANs](https://ucan.xyz/). \n The structure { commitCID, signature } is then, again, stored as a block. The hash (CID) of _this_ block is the root (head) of a repo. For each commit, this root hash changes. This root hash, with the contained signature and latest commit, thus contains the complete proof of the authenticity of the full repo.

This makes it very simple (and secure) to sync repos over untrusted connections or intermediaries.

For synchronization (and import/export) we use [CAR](https://ipld.io/specs/transport/car/carv1/) streams. They contain the blocks of an repo and allow incremental decoding and verifiation. This is already implemented and tested (a bit, more tests the better).

\
