import * as common from 'repco-common/zod'
import * as z from 'zod'

// The IPLD schema of repco. Also referred to RLDM (repco lower data model).

// Headers are a map of string keys and ipld values.
export const headersIpld = z.record(common.ipld)
export type HeadersIpld = z.infer<typeof headersIpld>

// An entry is the shared basic encoding for all other types.
// It has headers and a body. The body may be any IPLD.
// The meaning of the body is determined by the Kind header.
export const entryIpld = z.object({
  headers: headersIpld,
  body: common.ipld,
})

export type EntryIpld = z.infer<typeof entryIpld>

export const parentLink = z.union([
  z.object({ cid: common.cid }),
  z.object({ uid: common.uid }),
  z.object({ cid: common.cid, uid: common.uid }),
])

// The list of known headers.
// Most headers are valid and/or required on some entry kinds.
export const headers = {
  // All (required)
  Kind: z.string(),

  // Root (required)
  Signature: common.bytes,
  ProtocolVersion: z.number().default(0),

  // Commit, Revision (required)

  // Commit, Revision (optional)
  Message: z.string().nullish(),
  DateModified: z.date(),
  DateCreated: z.date(),

  // Commit
  Parents: z.array(common.cid).default([]),
  CommitUid: common.uid,
  Author: common.did, // iss
  Repo: common.did, // aud
  Proofs: z.array(common.cid.or(z.string())),

  // Revision
  RevisionUid: common.uid,
  ParentRevision: common.uid.nullish(),
  EntityUid: common.uid,
  EntityType: z.string(),
  EntityUris: z.array(common.uri).default([]),
  RevisionUris: z.array(common.uri).default([]),
  DerivedFrom: common.uid.nullish(),
  Deleted: z.boolean().default(false),

  // Injected on load, removed on save
  Cid: common.cid,
  BodyCid: common.cid,
} as const

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
export const rootHeaders = z
  .object(headers)
  .pick({
    Signature: true,
    ProtocolVersion: true,
  })
  .extend({ Kind: z.literal('root') })
export type RootHeaders = z.infer<typeof rootHeaders>

export const rootIpld = z.object({
  headers: rootHeaders,
  body: common.cid,
})
export type RootIpld = z.infer<typeof rootIpld>

// # Commit
// A commit contains a list of revisions.
export const commitHeaders = z
  .object(headers)
  .extend({ Kind: z.literal('commit') })
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
  headers: commitHeaders,
  // body is an array of tuples (cid, cid), where the first cid is the revision
  // and the second (optional) cid refers to the content
  body: z.array(z.tuple([common.cid, common.cid.nullish()])),
})
export type CommitIpld = z.infer<typeof commitIpld>

// # Revision
export const revisionHeaders = z
  .object(headers)
  .extend({ Kind: z.literal('revision') })
  .pick({
    Kind: true,
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
  .passthrough()
export type RevisionHeaders = z.infer<typeof revisionHeaders>
export const revisionIpld = z.object({
  headers: revisionHeaders,
  body: common.cid.nullish(),
})
export type RevisionIpld = z.infer<typeof revisionIpld>

// Forms
// Forms are partial records of revisions and commits with optional headers.
// This is the form in which content is submitted.

export const revisionForm = z.object({
  headers: revisionHeaders.extend({ PrevContentCid: common.cid.nullish() }),
  body: common.ipld,
})
export type RevisionForm = z.infer<typeof revisionForm>

export const commitForm = z.object({
  headers: commitHeaders,
  body: z.array(revisionForm),
})
export type CommitForm = z.infer<typeof commitForm>

// Bundles
// Bundles are the result of fetching a commit or revision with the referenced content/revisions.

export const revisionBundle = z.object({
  headers: revisionHeaders.extend({
    Cid: headers.Cid,
    BodyCid: headers.BodyCid,
  }),
  body: common.ipld.nullish(),
})
export type RevisionBundle = z.infer<typeof revisionBundle>

export const commitBundle = z.object({
  headers: commitHeaders.extend({
    Signature: headers.Signature,
    Cid: headers.Cid,
    BodyCid: headers.BodyCid,
  }),
  body: z.array(revisionBundle),
})
export type CommitBundle = z.infer<typeof commitBundle>

// Typed revisions

export function typedRevision<T extends typeof common.ipld>(bodyType: T) {
  return revisionIpld.extend({ body: bodyType })
}
export type TypedRevision<T extends typeof common.ipld> = z.infer<
  ReturnType<typeof typedRevision<T>>
>

export function typedRevisionForm<T extends typeof common.ipld>(bodyType: T) {
  return revisionForm.extend({ body: bodyType })
}
export type TypedRevisionForm<T extends typeof common.ipld> = z.infer<
  ReturnType<typeof typedRevisionForm<T>>
>

export function typedRevisionBundle<T extends typeof common.ipld>(bodyType: T) {
  return revisionBundle.extend({ body: bodyType })
}
export type TypedRevisionBundle<T extends typeof common.ipld> = z.infer<
  ReturnType<typeof typedRevisionBundle<T>>
>
