import * as ucans from '@ucans/ucans'
import { CID } from 'multiformats/cid'
import { CommitIpld, RootIpld } from 'repco-common/schema'

const PUBLISH_ABILITY = { namespace: 'repco', segments: ['PUBLISH'] }
const DEFAULT_LIFETIME = 3600 * 24 * 365 * 10 // 10 years

export async function verifySignature(
  did: string,
  payload: Uint8Array,
  sig: Uint8Array,
) {
  return ucans.defaults.verifySignature(did, payload, sig)
}

// Verify the authorization of a commit
// This throws if anything of the following is not true
// * the root contains a signature header
// * the signature is a valid signature by the commit's author (commit.header.Author)
//   over the commit cid (root.body).
// * the commit contains a Proof header that contains a UCAN capability which gives
//   Author the capability to publish to repo.did
export async function verifyRoot(
  root: RootIpld,
  commit: CommitIpld,
  repoDid: string,
) {
  await verifySignature(
    commit.headers.Author,
    root.body.bytes,
    root.headers.Signature,
  )
  const proof = commit.headers.Proofs[0]
  if (!proof) {
    throw new Error('Missing proof')
  } else if (proof instanceof CID) {
    throw new Error('CID proofs are not yet supported')
  } else {
    await verifyPublishingCapability(proof, commit.headers.Author, repoDid)
  }
}

export async function delegatePublishingCapability(
  repoKeypair: ucans.EdKeypair,
  audience: string,
) {
  const ucan = await ucans.build({
    audience,
    issuer: repoKeypair, // signing key
    lifetimeInSeconds: DEFAULT_LIFETIME,
    capabilities: [
      {
        with: {
          scheme: 'repco',
          hierPart: `//repo/${repoKeypair.did()}`,
        },
        can: PUBLISH_ABILITY,
      },
    ],
  })
  const token = ucans.encode(ucan)
  return token
}

export async function verifyPublishingCapability(
  token: string,
  audience: string,
  repoDid: string,
) {
  const result = await ucans.verify(token, {
    // to make sure we're the intended recipient of this UCAN
    audience,
    // A callback for figuring out whether a UCAN is known to be revoked
    isRevoked: async (_ucan) => false, // as a stub. Should look up the UCAN CID in a DB.
    // capabilities required for this invocation & which owner we expect for each capability
    requiredCapabilities: [
      {
        capability: {
          with: {
            scheme: 'repco',
            hierPart: `//repo/${repoDid}`,
          },
          can: PUBLISH_ABILITY,
        },
        rootIssuer: repoDid, // check against the root owner of the repo
      },
    ],
  })

  if (result.ok) {
    // The UCAN authorized the user
  } else {
    // Unauthorized
    throw new Error(
      `UCAN verification failed: ${audience} does not hold publishing capability for repo ${repoDid}`,
    )
  }
}

// export async function createRepoRoot() {
//   const keypair = await ucans.EdKeypair.create()

// }

// export async function signCommit(keypair: ucans.EdKeypair, repoDid: string, commitCid: CID) {
//   const signature = await keypair.sign(commitCid.bytes)
//   // const aud = `did: repco: ${ repoDid }`
//   // const ucan = await ucans.build({
//   //   audience: "did:key:zabcde...", // recipient DID
//   //   issuer: keypair, // signing key
//   //   capabilities: [ // permissions for ucan
//   //     {
//   //       with: { scheme: "repco", hierPart: `//${repoDid}/${commitCid.toString()}` },
//   //       can: { namespace: "repco", segments: [ "COMMIT" ] }
//   //     },
//   //   ]
//   // })
// }

// type SignedCommit = {
//   sig: Uint8Array,
//   cid: CID,
//   ucan: CID
// }
