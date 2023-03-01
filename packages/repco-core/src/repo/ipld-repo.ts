import * as ucans from '@ucans/ucans'
import * as common from 'repco-common/zod'
import { CID } from 'multiformats/cid'
import { IpldBlockStore } from './blockstore.js'
import {
  CommitBundle,
  CommitForm,
  commitIpld,
  RevisionBundle,
  RevisionForm,
  revisionIpld,
  rootIpld,
} from './ipld.js'
import { EntityInputWithHeaders } from '../entity.js'
import { SaveBatchOpts } from '../repo'
import { createEntityId, createRevisionId } from '../util/id.js'

const PROTOCOL_VERSION = 1

async function signAndStoreCommit(
  blockstore: IpldBlockStore,
  form: CommitForm,
  author: ucans.EdKeypair,
  opts: SaveBatchOpts
): Promise<CommitBundle | null> {
  if (form.headers.Author !== author.did()) throw new Error('Invalid keypair')
  // TODO: Check permission from proofs
  const commitBody = []
  const revisionBundles: RevisionBundle[] = []
  for (const revisionForm of form.body) {
    const bodyCid = await blockstore.put(revisionForm.body)
    if (
      revisionForm.headers.PrevContentCid &&
      revisionForm.headers.PrevContentCid.equals(bodyCid)
    ) {
      continue
    }
    const revision = revisionIpld.parse({
      headers: { ...revisionForm.headers, kind: 'revision' },
      body: bodyCid,
    })
    const cid = await blockstore.put(revision)
    commitBody.push([cid, bodyCid])
    revisionBundles.push({
      headers: {
        ...revision.headers,
        Cid: cid,
        BodyCid: bodyCid,
      },
      body: revisionForm.body,
    })
  }
  if (!commitBody.length && !opts.commitEmpty) return null
  const commit = commitIpld.parse({
    headers: { ...form.headers, kind: 'commit' },
    body: commitBody,
  })
  const bodyCid = await blockstore.put(commit)
  const signature = await author.sign(bodyCid.bytes)
  const root = rootIpld.parse({
    headers: {
      Kind: 'root',
      Signature: signature,
      ProtocolVersion: PROTOCOL_VERSION,
    },
    body: bodyCid,
  })
  const cid = await blockstore.put(root)
  const bundle: CommitBundle = {
    headers: {
      ...root.headers,
      ...commit.headers,
      BodyCid: bodyCid,
      Cid: cid,
    },
    body: revisionBundles,
  }
  return bundle
}

function prepareCommit(
  input: EntityInputWithHeaders[],
  repo: common.Did,
  author: ucans.EdKeypair,
  proofs: string[],
  parentCommit?: CID | null,
) {
  const now = new Date()
  const revisions = input.map((input) => prepareRevision(input, now))
  const form: CommitForm = {
    body: revisions,
    headers: {
      DateCreated: now,
      Author: author.did(),
      Proofs: proofs,
      Parents: parentCommit ? [parentCommit] : [],
      Repo: repo,
    },
  }
  return form
}

function prepareRevision(
  entity: EntityInputWithHeaders,
  now: Date,
): RevisionForm {
  const { content, headers } = entity
  const form: RevisionForm = {
    body: common.ipld.parse(content),
    headers: {
      Kind: 'revision',
      EntityUid: content.uid || createEntityId(),
      RevisionUid: createRevisionId(),
      DateCreated: headers.dateCreated || now,
      DateModified: now,
      Deleted: headers.isDeleted || false,
      DerivedFrom: headers.derivedFromUid || undefined,
      EntityType: entity.type,
      EntityUris: headers.entityUris || [],
      RevisionUris: headers.revisionUris || [],
      ParentRevision: headers.prevRevisionId ? headers.prevRevisionId : null,
      PrevContentCid: entity.prevContentCid
        ? CID.parse(entity.prevContentCid)
        : null,
    },
  }
  return form
}

export class IpldRepo {
  constructor(public repoDid: string, public blockstore: IpldBlockStore) {}
  get did() {
    return this.repoDid
  }
  async createCommit(
    entities: EntityInputWithHeaders[],
    author: ucans.EdKeypair,
    proof: string,
    opts: SaveBatchOpts,
    parentCommit?: CID | null,
  ) {
    const form = prepareCommit(
      entities,
      this.did,
      author,
      [proof],
      parentCommit,
    )
    const bundle = await signAndStoreCommit(this.blockstore, form, author, opts)
    return bundle
  }
}
