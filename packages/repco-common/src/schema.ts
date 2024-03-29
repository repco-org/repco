//! The IPLD schema of repco. Also referred to RLDM (repco lower data model).
//!
//! This module contains zod validation schemas and TypeScript types for the
//! RLDM.
//!
//! The RLDM encodes all data in `entry`s. The binary encoding must bei DAG-CBOR.
//! CIDs must be CID-v1, codec DAG-CBOR, hash BLAKE-3.
//!
//! The RLDM consist of 3 entry kind and raw content. The entry kinds are:
//! `root`, `commit`, `revision`.

import * as z from 'zod'
import * as common from './zod.js'

// Headers are a map of string keys and ipld values.
export const headersIpld = z.record(common.ipld)
export type HeadersIpld = z.infer<typeof headersIpld>

// An entry is the shared basic encoding for all other types.
// It has headers and a body. The body may be any IPLD.
// The meaning of the body is determined by the Kind header.
export const entryIpld = z.object({
  kind: z.string(),
  headers: headersIpld,
  body: common.ipld,
})

export type EntryIpld = z.infer<typeof entryIpld>

// The list of known headers.
// Most headers are valid and/or required on some entry kinds.
export const headers = {
  // -- Root --
  // The ed25591 signature by the commit's author over commit cid
  Signature: common.bytes,
  // The protocol version (always 0 currently)
  ProtocolVersion: z.number().default(0),

  // -- Commit, Revision (optional) --
  DateModified: z.date(),
  DateCreated: z.date(),
  // Optional commit message string (currently unused)
  Message: z.string().nullish(),

  // -- Commit --
  // Parent commits (usually the single previous commit on the repo)
  Parents: z.array(common.cid).default([]),
  // Commit uid (auto-assigned)
  CommitUid: common.uid,
  // Commit author (DID to keypair that signs this commit)
  Author: common.did,
  // Repo this commit belongs to (DID of repo keypair)
  Repo: common.did,
  // UCANs that provide the capability for Author to publish to Repo
  Proofs: z.array(common.cid.or(z.string())),

  // -- Revision --
  EntityUid: common.uid,
  EntityType: z.string(),
  // Revision uid (auto-assigned)
  RevisionUid: common.uid,
  // uid of previous revision of the same entity
  ParentRevision: common.uid.nullish(),
  // entity uris (external ids) that identify this entity
  EntityUris: z.array(common.uri).default([]),
  // revision uris (external ids) that identify this particular entitiy revision
  RevisionUris: z.array(common.uri).default([]),
  // optional: uid of the source record from which this revision originates
  DerivedFrom: common.uid.nullish(),
  // if true, mark the entity as deleted (tombstoned)
  Deleted: z.boolean().default(false),

  // Injected on load, removed on save
  // These headers are never saved into the blockstore
  // when loading blocks, they may be added to make the blocks CID available
  Cid: common.cid,
  RootCid: common.cid,
  BodyCid: common.cid,
} as const

export const parsedHeaders = z.object(headers).partial()
export type ParsedHeaders = z.infer<typeof parsedHeaders>

export type HeaderName = keyof typeof headers
export const headerNames = Object.fromEntries(
  Object.keys(headers).map((k) => [k, k]),
) as { [Name in HeaderName]: Name }

// # Root
// A signed commit and thus a "root" of a repo.
// The body is the CID of a commit.
// It has a single Signature headers. To validate the signature,
// the body has to be fetched and parsed.
// The signature is created by signing the body CID with the Author keypair,
// as set in the Author header of the entry referred to be the body CID.
export const rootHeaders = z.object(headers).pick({
  // Authorization: true,
  Signature: true,
  ProtocolVersion: true,
})
export type RootHeaders = z.infer<typeof rootHeaders>

export const rootIpld = z.object({
  kind: z.literal('root'),
  headers: rootHeaders,
  body: common.cid,
})
export type RootIpld = z.infer<typeof rootIpld>

// # Commit
// A commit contains a list of revisions.
export const commitHeaders = z
  .object(headers)
  .pick({
    Author: true,
    Repo: true,
    Proofs: true,
    // Uid: true,
    DateCreated: true,
    Message: true,
    Parents: true,
  })
  .partial({ Message: true })
  .passthrough()

export type CommitHeaders = z.infer<typeof commitHeaders>
export const commitIpld = z.object({
  kind: z.literal('commit'),
  headers: commitHeaders,
  // body is an array of tuples [cid, cid], where the first cid is the revision
  // and the second (optional) cid is the revision body cid (actual content of the entity)
  body: z.array(z.tuple([common.cid, common.cid.nullish()])),
})
export type CommitIpld = z.infer<typeof commitIpld>

// # Revision
export const revisionHeaders = z
  .object(headers)
  .pick({
    RevisionUid: true,
    EntityUid: true,
    DateModified: true,
    DateCreated: true,
    Message: true,
    ParentRevision: true,

    EntityType: true,
    EntityUris: true,
    RevisionUris: true,
    DerivedFrom: true,
    Deleted: true,
  })
  .partial({
    Message: true,
    DateCreated: true,
    DerivedFrom: true,
    Deleted: true,
  })
export type RevisionHeaders = z.infer<typeof revisionHeaders>
export const revisionIpld = z.object({
  kind: z.literal('revision'),
  headers: revisionHeaders,
  body: common.cid.nullish(),
})
export type RevisionIpld = z.infer<typeof revisionIpld>

// Forms
// Forms are partial records of revisions and commits with optional headers.
// This is the form in which content is submitted.

export const revisionForm = z.object({
  kind: z.literal('revision'),
  headers: revisionHeaders.extend({ PrevContentCid: common.cid.nullish() }),
  body: common.ipld,
})
export type RevisionForm = z.infer<typeof revisionForm>

export const commitForm = z.object({
  kind: z.literal('commit'),
  headers: commitHeaders,
  body: z.array(revisionForm),
})
export type CommitForm = z.infer<typeof commitForm>

// Bundles
// Bundles are the result of fetching a commit or revision with the referenced content/revisions.
// revision:
//     { kind: 'revision', headers: {...}, body: bodyCid, }   --> cid: revCid
// revisionBundle:
//     { kind: 'revision', headers: {..., bodyCid, Cid: revCid }, body: <ipld> }
// where <ipld> is the loaded and decoded block for bodyCid

export const revisionBundle = z.object({
  headers: revisionHeaders.extend({
    Cid: headers.Cid,
    BodyCid: headers.BodyCid,
  }),
  body: common.ipld.nullish(),
})
export type RevisionBundle = z.infer<typeof revisionBundle>

// A commit bundle is returned from `repo.saveBatch`, so the result of saving a new batch of entity
// revision in a single commit plus a new signed root.
export const commitBundle = z.object({
  headers: commitHeaders.extend({
    Signature: headers.Signature,
    Cid: headers.Cid,
    RootCid: headers.RootCid,
  }),
  body: z.array(revisionBundle),
})
export type CommitBundle = z.infer<typeof commitBundle>

// TODO: If desired, we could likely upcast revisions into TypedRevisions
// that bring content type awareness into their type
//
// Typed revisions
// export function typedRevision<T extends typeof common.ipld>(bodyType: T) {
//   return revisionIpld.extend({ body: bodyType })
// }
// export type TypedRevision<T extends typeof common.ipld> = z.infer<
//   ReturnType<typeof typedRevision<T>>
// >
//
// export function typedRevisionForm<T extends typeof common.ipld>(bodyType: T) {
//   return revisionForm.extend({ body: bodyType })
// }
// export type TypedRevisionForm<T extends typeof common.ipld> = z.infer<
//   ReturnType<typeof typedRevisionForm<T>>
// >
//
// export function typedRevisionBundle<T extends typeof common.ipld>(bodyType: T) {
//   return revisionBundle.extend({ body: bodyType })
// }
// export type TypedRevisionBundle<T extends typeof common.ipld> = z.infer<
//   ReturnType<typeof typedRevisionBundle<T>>
// >
//
// TODO: Instead of having a bare Signature field on roots, instead we might want
// to have an Authorization field that can encode signatures, proofs, etc.
// Or, likely even better, the Authorization can be a UCAN directly that is a delegation of the actual
// capabilty with the content (scope) cid(s) in the fct (fact) field
// export const authorizationIpld = z
//   .array(
//     z.object({
//       iss: common.did,
//       scope: z.array(common.cid),
//       prf: z.array(common.ucan),
//       sig: common.bytes,
//     }),
//   )
//   .default([])
// export type AuthorizationIpld = z.infer<typeof authorizationIpld>
