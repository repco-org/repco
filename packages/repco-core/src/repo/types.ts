import * as common from 'repco-common/zod'
import * as z from 'zod'
import { CID } from 'multiformats/cid.js'
import { repco, Revision } from 'repco-prisma'

export const commitIpld = z.object({
  kind: z.literal('commit'),
  repoDid: common.uid,
  agentDid: common.uid,
  parent: common.cid.nullish(),
  timestamp: z.date(),
  revisions: z.array(common.cid),
})
export interface CommitIpld extends z.infer<typeof commitIpld> {}

export const headersForm = z.object({
  // TODO: uid / did
  agent: z.string().nullish(),
  dateModified: z.date().nullish(),
  dateCreated: z.date().nullish(),
  revisionUris: z.array(z.string()).optional(),
  entityUris: z.array(z.string()).optional(),
  prevRevisionId: z.string().nullish(),
  isDeleted: z.string().nullish(),
  derivedFromUid: common.uid.optional(),
})
export interface Headers extends z.infer<typeof headersForm> {}

export const entityForm = z.object({
  type: z.string(),
  content: z.object({}).passthrough(),
  headers: headersForm.nullish(),
})

export interface ZodEntityForm extends z.infer<typeof entityForm> {}

export const revisionIpld = z.object({
  kind: z.literal('revision'),
  id: z.string(),
  prevRevisionId: z.string().or(z.null()),
  uid: z.string(),
  repoDid: z.string(),
  agentDid: z.string(),
  entityType: z.string(),
  dateModified: z.date(),
  dateCreated: z.date(),
  isDeleted: z.boolean().default(false),
  entityUris: z.array(z.string()).default([]),
  revisionUris: z.array(z.string()).default([]),
  contentCid: common.cid,
  derivedFromUid: common.uid.nullish(),
})

export type RevisionIpld = {
  kind: 'revision'
  id: string
  prevRevisionId: string | null
  uid: string
  repoDid: string
  agentDid: string
  entityType: string
  dateModified: Date
  dateCreated: Date
  isDeleted: boolean
  entityUris: string[]
  revisionUris: string[]
  contentCid: CID
  derivedFromUid?: common.Uid | null
}

export const rootIpld = z.object({
  kind: z.literal('root'),
  sig: common.bytes,
  commit: common.cid,
  cap: z.string(),
  agent: z.string(),
})

export type RootIpld = {
  kind: 'root'
  sig: Uint8Array
  commit: CID
  cap: string
  agent: string
}

export function revisionIpldToDb(
  input: RevisionIpld,
  revisionCid: CID,
): Revision {
  const { kind, ...rest } = input
  return {
    ...rest,
    derivedFromUid: input.derivedFromUid || null,
    contentCid: input.contentCid.toString(),
    revisionCid: revisionCid.toString(),
  }
}

export type CommitBundle = {
  root: { cid: CID; body: RootIpld }
  commit: { cid: CID; body: CommitIpld }
  revisions: {
    revision: RevisionIpld
    revisionCid: CID
    content: unknown
    parsedContent?: repco.EntityInput
  }[]
}
