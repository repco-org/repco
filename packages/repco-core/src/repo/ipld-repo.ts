import * as ucans from '@ucans/ucans'
import { CID } from 'multiformats/cid.js'
import { Repo as RepoRecord } from 'repco-prisma'
import { IpldBlockStore } from './blockstore.js'
import { EntityInputWithHeaders } from '../entity.js'
import { CommitIpld, RevisionIpld, RootIpld } from './types.js'
import { RevisionWithUnknownContent, SaveBatchOpts } from '../repo'
import { createRevisionId } from '../util/id.js'

export class IpldRepo {
  constructor(public record: RepoRecord, public blockstore: IpldBlockStore) { }
  get did() {
    return this.record.did
  }
  async createCommit(
    entities: EntityInputWithHeaders[],
    agentKeypair: ucans.EdKeypair,
    publishingCapability: string,
    opts: SaveBatchOpts,
    parentCommit?: CID | null,
  ) {
    const agentDid = agentKeypair.did()
    const timestamp = new Date()
    // TODO: Reactive transaction support once timing issues with Prisma are fixed.
    // this.blockstore = this.blockstore.transaction()
    // save all revisions in blockstore
    const revisions = []
    for (const entity of entities) {
      const revision = await this.createRevision(agentDid, entity)
      if (revision) {
        revisions.push({ ...revision, parsedContent: entity })
      }
    }

    if (!opts.commitEmpty && !revisions.length) return null

    // save commit ipld
    const commit: CommitIpld = {
      kind: 'commit',
      repoDid: this.did,
      agentDid,
      parent: parentCommit,
      revisions: revisions.map((r) => r.revisionCid),
      timestamp,
    }
    const commitCid = await this.blockstore.put(commit)
    const root: RootIpld = {
      kind: 'root',
      commit: commitCid,
      sig: await agentKeypair.sign(commitCid.bytes),
      cap: publishingCapability,
      agent: agentDid,
    }
    const rootCid = await this.blockstore.put(root)

    // batch commit ipld changes
    this.blockstore = await this.blockstore.commit()

    const bundle = {
      root: { cid: rootCid, body: root },
      commit: { cid: commitCid, body: commit },
      revisions,
    }
    return bundle
  }

  private async createRevision(
    agentDid: string,
    entity: EntityInputWithHeaders,
  ): Promise<RevisionWithUnknownContent | null> {
    const headers = entity.headers
    const contentCid = await this.blockstore.put(entity.content)
    if (contentCid.toString() === entity.prevContentCid) return null
    const id = createRevisionId()
    if (!headers.dateModified) headers.dateModified = new Date()
    if (!headers.dateCreated) headers.dateCreated = new Date()
    const revisionWithoutCid: RevisionIpld = {
      kind: 'revision',
      id,
      prevRevisionId: headers.prevRevisionId || null,
      contentCid,
      entityType: entity.type,
      uid: entity.uid,
      repoDid: this.did,
      agentDid,
      revisionUris: headers.revisionUris || [],
      entityUris: headers.entityUris || [],
      isDeleted: false,
      dateModified: headers.dateModified || new Date(),
      dateCreated: headers.dateCreated || new Date(),
      derivedFromUid: headers.derivedFromUid,
    }
    const revisionCid = await this.blockstore.put(revisionWithoutCid)
    return {
      revision: revisionWithoutCid,
      revisionCid,
      content: entity.content,
    }
  }
}
