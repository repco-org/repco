import { CarBlockIterator } from '@ipld/car'
import { CID } from 'multiformats/cid.js'
import { verifySignature } from './auth.js'
import { parseBytesWith, parseToIpld, validateCID } from './blockstore.js'
import {
  CommitBundle,
  commitIpld,
  Repo,
  RevisionIpld,
  RootIpld,
  CommitIpld,
  revisionIpld,
  rootIpld,
} from '../repo.js'

export class UnexpectedCidError extends Error {
  constructor(public received: CID, public expected: CID, public kind: string) {
    super(`Wrong CID: Expected ${kind} ${expected}, but received ${received}`)
  }
}

export async function importRepoFromCar(
  repo: Repo,
  stream: AsyncIterable<Uint8Array>,
) {
  const reader = await CarBlockIterator.fromIterable(stream)
  for await (const bundle of parseCommitBundle(reader, repo)) {
    await repo.saveFromIpld(bundle)
  }
}

type CommitBundlePartial = {
  root?: { cid: CID; body: RootIpld }
  commit?: { cid: CID; body: CommitIpld }
  revisions: {
    revision: RevisionIpld,
    revisionCid: CID,
    content: any
  }[]
}


enum State {
  Root = 'root',
  Commit = 'commit',
  Revision = 'revision',
  Content = 'content',
  Yield = 'yield',
  Never = 'never',
}

async function* parseCommitBundle(
  reader: CarBlockIterator,
  repo: Repo,
): AsyncGenerator<CommitBundle> {
  let state: State = State.Root
  let bundle: CommitBundlePartial = { revisions: [] }
  let revision: { cid: CID; body: RevisionIpld } | undefined
  for await (const block of reader) {
    await validateCID(block)
    switch (state) {
      case State.Root:
        bundle = {
          revisions: [],
          root: {
            body: parseBytesWith(block.bytes, rootIpld),
            cid: block.cid,
          },
        }
        state = State.Commit
        break
      case State.Commit:
        if (!bundle.root) throw new Error('invalid state')
        if (!bundle.root.body.commit.equals(block.cid)) {
          throw new UnexpectedCidError(
            block.cid,
            bundle.root.body.commit,
            state,
          )
        }
        bundle.commit = {
          body: parseBytesWith(block.bytes, commitIpld),
          cid: block.cid,
        }
        if (bundle.commit.body.repoDid !== repo.did) {
          throw new Error('commit does not belong to repo')
        }
        await verifySignature(
          bundle.commit.body.repoDid + '',
          bundle.root.body.commit.bytes,
          bundle.root.body.sig,
        )
        state = State.Revision
        break
      case State.Revision:
        if (!bundle.commit) throw new Error('invalid state')
        if (!bundle.commit.body.revisions.find((x) => block.cid.equals(x))) {
          throw new Error('revision is not in commit')
        }
        revision = {
          body: parseBytesWith(block.bytes, revisionIpld),
          cid: block.cid,
        }
        state = State.Content
        break
      case State.Content:
        if (!revision) throw new Error('invalid state')
        if (!revision.body.contentCid.equals(block.cid)) {
          throw new UnexpectedCidError(
            block.cid,
            revision.body.contentCid,
            state,
          )
        }
        bundle.revisions.push({
          revision: revision.body,
          revisionCid: revision.cid,
          content: parseToIpld(block.bytes),
        })
        revision = undefined
        state = State.Revision
        break
      default:
        throw new Error('invalid state')
    }
    await repo.blockstore.putBytes(block.cid, block.bytes)
    if (
      state === State.Revision &&
      bundle.revisions.length === bundle.commit?.body.revisions.length
    ) {
      if (!bundle.root) throw new Error('missing root block')
      if (!bundle.commit) throw new Error('missing commit block')
      yield {
        root: bundle.root,
        commit: bundle.commit,
        revisions: bundle.revisions,
      }
      state = State.Root
    }
  }
}
