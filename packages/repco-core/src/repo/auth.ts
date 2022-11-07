import * as ucans from '@ucans/ucans'

export type Authority = {
  did: string
  keypair?: ucans.EdKeypair
}

export async function verifySignature(
  did: string,
  payload: Uint8Array,
  sig: Uint8Array,
) {
  return ucans.defaults.verifySignature(did, payload, sig)
}

// export async function createRepoRoot() {
//   const keypair = await ucans.EdKeypair.create()

// }

// export async function signCommit(keypair: ucans.EdKeypair, repoDid: string, commitCid: CID) {
//   const signature = await keypair.sign(commitCid.bytes)
//   // const aud = `did:repco:${repoDid}`
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
